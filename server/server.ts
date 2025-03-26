import fastify from "./app";
import { LOCAL } from "./constants";

const start = async () => {
  const environment = process.env.NODE_ENV || "local";

  try {
    // await database.sync();
    // await stasherAPI.initializeStasher(fastify);
    if (environment !== LOCAL) {
      fastify.listen({ port: process.env.PORT }, "0.0.0.0", (err: any) => {
        if (err) {
          console.error("Error starting server:", err);
          process.exit(1); // Exit the process if there's an error starting the server
        }

        console.log(`Server is running on port ${process.env.PORT}`);
      });
    } else {
      await fastify.listen({ port: process.env.PORT }, (err: any) => {
        // dev mode
        if (err) {
          console.error("Error starting server:", err);
          process.exit(1); // Exit the process if there's an error starting the server
        }

        console.log(`Server is running on port ${process.env.PORT}`);
      });
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
