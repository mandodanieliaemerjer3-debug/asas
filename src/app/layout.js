import { AuthProvider } from "../contexts/AuthContext";

export const metadata = {
  title: "Delivery App Daniel",
  description: "App exclusivo para pedidos",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <meta name="theme-color" content="#dc2626" />
      </head>
      <body className="bg-gray-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}