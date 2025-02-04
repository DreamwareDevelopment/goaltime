import { getPrismaClient } from "@/server-utils/prisma";
import { monthlyPricingPlans, yearlyPricingPlans } from "@/shared/utils";
import { FastifyInstance } from "fastify";
import { stripe } from "@/server-utils/stripe";
import Stripe from 'stripe';
import { sendSMS } from "@/server-utils/ai";
import { Plan } from "@prisma/client";
import { inngestConsumer, InngestEvent } from "@/server-utils/inngest";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
if (!WEBHOOK_SECRET) {
  throw new Error('Stripe webhook secret not configured correctly');
}

export default async function (fastify: FastifyInstance) {
  fastify.post('/stripe', async function (request, reply) {
    const header = request.headers['stripe-signature'] as string;
    if (!header) {
      console.log(`Missing stripe-signature header: ${header}`)
      reply.status(400).send({ error: 'Missing stripe-signature header' });
      return;
    }
    const prisma = await getPrismaClient();
    
    const event = request.body as Stripe.Event;
    console.log(event.type)
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          console.log('checkout.session.completed')
          const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
            expand: ['line_items']
          });
          const customerId = session?.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const email = (customer as any)?.email as string | undefined;
          if (!email) {
            console.log('Invalid email')
            reply.status(400).send({ error: 'Invalid email' });
            return;
          }
          const productId = session?.line_items?.data[0]?.price?.product as string;
          const priceId = session?.line_items?.data[0]?.price?.id as string;
          let plan = yearlyPricingPlans.find(plan => plan.priceId === priceId);
          if (!plan) {
            plan = monthlyPricingPlans.find(plan => plan.priceId === priceId);
          }
          if (!plan) {
            console.log('Invalid price id')
            reply.status(400).send({ error: 'Invalid price id' });
            return;
          }
          console.log('Updating user profile after checkout.session.completed')
          const user = await prisma.userProfile.update({
            where: { email },
            data: {
              plan: plan.plan,
              stripeCustomerId: customerId,
              stripeProductId: productId,
              stripePriceId: priceId,
            },
            select: {
              userId: true,
              phone: true,
              plan: true,
              stripeCustomerId: true,
              stripeProductId: true,
              stripePriceId: true,
            }
          });
          if (!user?.userId) {
            console.log('User not found after checkout.session.completed')
            reply.status(400).send({ error: 'User not found' });
            return;
          }
          await inngestConsumer.send({
            name: InngestEvent.SyncToClient,
            data: {
              userId: user?.userId,
              profile: user,
            }
          });
          console.log('Sending welcome SMS')
          await sendSMS(user.phone, `Welcome to GoalTime, we're glad to have you onboard! I'm your GoalTime accountability agent, go ahead and save my contact info so we can keep in touch.`);
          break;
        }
        case 'customer.subscription.deleted': {
          console.log('customer.subscription.deleted')
          const subscription = await stripe.subscriptions.retrieve(event.data.object.id);
          const customerId = subscription?.customer as string | undefined;
          if (!customerId) {
            console.log('Invalid customer id for customer.subscription.deleted')
            reply.status(400).send({ error: 'Invalid customer id' });
            return;
          }
          const user = await prisma.userProfile.update({
            where: { stripeCustomerId: customerId },
            data: {
              plan: Plan.None,
              stripeProductId: null,
              stripePriceId: null,
            },
            select: {
              userId: true,
              phone: true,
              plan: true,
              stripeCustomerId: true,
              stripeProductId: true,
              stripePriceId: true,
            }
          })
          if (!user?.userId) {
            console.log('User not found for customer.subscription.deleted')
            reply.status(400).send({ error: 'User not found' });
            return;
          }
          await inngestConsumer.send({
            name: InngestEvent.SyncToClient,
            data: {
              userId: user?.userId,
              profile: user,
            }
          });
          console.log('Sending goodbye SMS')
          await sendSMS(user.phone, `Your GoalTime subscription has been cancelled. We hope to see you again soon!`);
          break;
        }
        default: {
          reply.status(200).send({ message: 'Unhandled event type' });
          return;
        }
      }
    } catch {
      reply.status(400).send({ error: 'Invalid session id' });
      return;
    }
  })
}
