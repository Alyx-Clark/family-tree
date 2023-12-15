import { createConnection } from "mysql2/promise";

const connection = await createConnection({
  host: Bun.env.DB_HOST,
  user: Bun.env.DB_USER,
  password: Bun.env.DB_PASSWORD,
  database: Bun.env.DB_DATABASE,
});


export default connection;
