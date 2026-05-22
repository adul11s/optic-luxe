import { redirect } from "next/navigation";
import { Providers } from "./providers";
import "./globals.css";

export default function Home() {
  redirect("/home");
}