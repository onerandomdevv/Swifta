import Navbar from "@/components/layout/navbar";

export default function BuyerDashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Buyer Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">Active RFQs</h2>
            <p className="text-3xl font-bold mt-2">3</p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">Orders in Progress</h2>
            <p className="text-3xl font-bold mt-2">1</p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">Completed Orders</h2>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
