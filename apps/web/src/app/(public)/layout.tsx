export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* TODO: Add Public Header (Login/Register, category bar, WhatsApp button) */}
      <main>{children}</main>
    </>
  );
}
