import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Socket Next.js Example",
  description: "An example Next.js Example Application",
};

export default function RootLayout ({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta
          http-equiv="Content-Security-Policy"
          content="
            connect-src socket: https: http: blob: ipc: npm: node: wss: ws: ws://localhost:*;
             script-src socket: https: http: blob: npm: node: http://localhost:* 'unsafe-eval' 'unsafe-inline';
             worker-src socket: https: http: blob: 'unsafe-eval' 'unsafe-inline';
              frame-src socket: https: http: blob: http://localhost:*;
                img-src socket: https: http: blob: http://localhost:*;
              child-src socket: https: http: blob:;
             object-src 'none';
          "
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
