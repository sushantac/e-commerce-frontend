import dynamic from "next/dynamic";

const ClientPage = dynamic(() => import("./ClientPage"), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading…</div>,
});

export default function Page() {
  return <ClientPage />;
}
