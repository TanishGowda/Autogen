import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <main className="ml-64 p-8 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
