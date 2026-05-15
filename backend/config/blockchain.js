import { JsonRpcProvider, Wallet } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL);

const wallet = new Wallet(
  process.env.PRIVATE_KEY,
  provider
);

export { provider, wallet };
