import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "Night-Ai";
export default defineRailway(() => {
  const NightAi = service("Night-Ai", {
    source: github("Ayokule/Night-Ai", { branch: "main", checkSuites: false }),
    build: { buildCommand: "npm install && npm --prefix client run build", buildEnvironment: "V3", builder: "RAILPACK" },
    start: "node server/index.js",
    replicas: { "europe-west4-drams3a": 1 },
    deploy: { sleepApplication: true },
    networking: { privateNetworkEndpoint: "night-ai" },
  });

  return project("luminous-emotion", {
    variables: { managed: false },
    resources: [NightAi],
  });
});
