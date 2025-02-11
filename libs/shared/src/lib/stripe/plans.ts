import { Plan } from "@prisma/client";

export interface PricingPlan {
  name: string;
  price: string;
  priceId: string;
  features: string[];
  link: string;
  comingSoon?: boolean;
  plan: Plan;
}

export const monthlyPricingPlans: PricingPlan[] = [
  {
    name: "Committed",
    plan: Plan.Committed,
    price: "$15.99/month",
    priceId: process.env['NODE_ENV'] === "development" ? "price_1QlNrbGgKXfQOqA9uyg8Nax6" : "price_1QljQSGjEzBfLZlUnLXmUqXU",
    features: ["Unlimited goal setting", "Automatic time blocking", "AI progress tracking"],
    link: process.env['NODE_ENV'] === "development" ? "https://buy.stripe.com/test_bIYaEL8hr0t1fbq000" : "https://buy.stripe.com/6oE8yZ1Ag2T59eo288",
  },
  {
    name: "Ambitious",
    plan: Plan.Ambitious,
    price: "$35.99/month",
    priceId: process.env['NODE_ENV'] === "development" ? "price_1QlNv3GgKXfQOqA9vAmIX7fZ" : "price_1QljS7GjEzBfLZlUXdY0fKWb",
    features: [`All Committed features`, "AI Accountability Agent", "AI Rescheduling", "Priority support"],
    comingSoon: true,
    link: process.env['NODE_ENV'] === "development" ? "https://buy.stripe.com/test_28o5kr41b5Nl1kA003" : "https://buy.stripe.com/3cs16x6UActFaisaEG",
  },
  {
    name: "Superhuman",
    plan: Plan.Superhuman,
    price: "$69.99/month",
    priceId: process.env['NODE_ENV'] === "development" ? "price_1QlO0EGgKXfQOqA9NLM1pigy" : "price_1QljVwGjEzBfLZlU9eDgMmYl",
    features: [`All Ambitious Features`, "Shared Goals", "Custom Analytics", "External AI Agents"],
    comingSoon: true,
    link: process.env['NODE_ENV'] === "development" ? "https://buy.stripe.com/test_4gw3cj9lv5Nl6EUaEI" : "https://buy.stripe.com/3cscPfdiY1P1bmw7sw",
  },
]

export const yearlyPricingPlans: PricingPlan[] = [
  {
    name: "Committed",
    plan: Plan.Committed,
    price: "$159.99/year",
    priceId: process.env['NODE_ENV'] === "development" ? "price_1QlNsrGgKXfQOqA9Lr3M35tW" : "price_1QljRCGjEzBfLZlUCCz1I5n4",
    features: ["Unlimited goal setting", "Automatic time blocking", "AI progress tracking"],
    link: process.env['NODE_ENV'] === "development" ? "https://buy.stripe.com/test_bIYdQX8hr6Rp9R6145" : "https://buy.stripe.com/14kcPf6UAgJVbmw145",
  },
  {
    name: "Ambitious",
    plan: Plan.Ambitious,
    price: "$359.99/year",
    priceId: process.env['NODE_ENV'] === "development" ? "price_1QlNyqGgKXfQOqA9pHVKG200" : "price_1QljTUGjEzBfLZlUsLPP5fGj",
    features: [`All Committed features`, "AI Accountability Agent", "AI Rescheduling", "Priority support"],
    comingSoon: true,
    link: process.env['NODE_ENV'] === "development" ? "https://buy.stripe.com/test_6oEcMT0OZ1x58N29AC" : "https://buy.stripe.com/eVaaH75Qw1P1gGQ8wz",
  },
  {
    name: "Superhuman",
    plan: Plan.Superhuman,
    price: "$699.99/year",
    priceId: process.env['NODE_ENV'] === "development" ? "price_1QlO0sGgKXfQOqA9TrkRD3hb" : "price_1QljWkGjEzBfLZlUmLBNIv19",
    features: [`All Ambitious Features`, "Shared Goals", "Custom Analytics", "External AI Agents"],
    comingSoon: true,
    link: process.env['NODE_ENV'] === "development" ? "https://buy.stripe.com/test_9AQeV1dBLfnVfbq9AF" : "https://buy.stripe.com/6oEbLben2gJVeyI9AF",
  },
]
