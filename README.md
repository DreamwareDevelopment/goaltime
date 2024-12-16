# GoalTime

## Local Development

1. Install Docker Desktop
2. Get a copy of .env for the Next App and .env.local for Supabase and Prisma (they should always be in sync)
3. Setup ngrok with the following config
```ngrok.yml
version: "3"
agent:
    authtoken: <your-token>
tunnels:
  first:
    addr: 3000
    proto: http
    domain: <your-next-static-domain>
  second:
    addr: https://localhost:54321
    proto: http
    domain: <your-supabase-static-domain>
```
- Set the site_url to your next ngrok url in config.toml
- Set the additional_redirect_urls to ["https://<your-next-ngrok-url>/auth/callback"] in config.toml
- Request that your next ngrok url be added to HCaptcha and Google OAuth
- Set FUNCTIONS_URL secret in Supabase Vault to your supabase ngrok url
- Setup NEXT_PUBLIC_HOST to your next ngrok url in both .env and .env.local
4. Run `ngrok start --all` or `npx nx@latest shared:local-proxy`
5. Run `npx nx@latest shared:db` to start the local supabase containers
6. Run `CREATE ROLE "service" WITH LOGIN PASSWORD '<password>';` in the supabase dashboard
- Set the credentials for service in the MY_PRISMA_URL in both the .env .env.local files
- You'll need to run `npx nx@latest shared:db` again for the changes to take effect
7. Run `npx nx@latest shared:init` to initialize the database and apply schema migrations
8. Run `npx nx@latest shared:functions` to start the supabase edge functions runtime
9. Navigate to your next ngrok url in your browser to start using the app

## On Prisma Migrations

If any migration fails to apply you can go to the project.json for the shared project go to `npx nx@latest shared:rollback-failed-migration` and edit the command with the name of the failed migration. Afterwords running `npx nx@latest shared:migrate` should work if the migration is successful.

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/next?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/0uEvf7QzRj)


## Run tasks

To run the dev server for your app, use:

```sh
npx nx dev goaltime
```

To create a production bundle:

```sh
npx nx build goaltime
```

To see all available targets to run for a project, run:

```sh
npx nx show project goaltime
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/next:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/react:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/next?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
