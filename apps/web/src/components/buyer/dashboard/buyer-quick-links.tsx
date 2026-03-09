import Link from "next/link";

export function BuyerQuickLinks() {
  const quickLinks = [
    {
      label: "Create New RFQ",
      sub: "Request quotes for new products",
      icon: "add_box",
      color: "bg-navy-dark",
      textColor: "text-white",
    },
    {
      label: "Browse Catalogue",
      sub: "View verified items",
      icon: "storefront",
      color: "bg-white",
      textColor: "text-navy-dark",
    },
  ];

  return (
    <div className="lg:col-span-4 space-y-8">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">
          electric_bolt
        </span>
        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
          Quick Links
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-5">
        {quickLinks.map((link, idx) => {
          const href = idx === 0 ? "/buyer/rfqs/new" : "/buyer/catalogue";
          return (
            <Link
              key={idx}
              href={href}
              className={`${link.color} ${link.textColor} p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex items-center gap-6`}
            >
              <div
                className={`size-14 rounded-2xl ${link.color === "bg-white" ? "bg-slate-50 dark:bg-slate-800" : "bg-white/10"} flex items-center justify-center`}
              >
                <span className="material-symbols-outlined text-2xl font-black">
                  {link.icon}
                </span>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest mb-1">
                  {link.label}
                </p>
                <p
                  className={`${link.color === "bg-white" ? "text-slate-500" : "text-white/60"} text-[10px] font-bold uppercase tracking-tight`}
                >
                  {link.sub}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Marketplace Tips Box */}
      <div className="bg-navy-dark rounded-3xl p-8 text-white relative overflow-hidden group">
        <div className="relative z-10 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
            Marketplace Tips
          </p>
          <h4 className="text-lg font-black leading-tight uppercase">
            Get better rates by bundling RFQs for similar items.
          </h4>
        </div>
        <div className="absolute -bottom-10 -right-10 size-40 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-[2s]"></div>
      </div>
    </div>
  );
}
