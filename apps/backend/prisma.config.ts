import "dotenv/config";
import { env, defineConfig } from "@prisma/config";

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
});

