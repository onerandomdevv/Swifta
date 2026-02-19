'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-primary-navy">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-navy p-1.5 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-2xl">settings_input_component</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary-navy">Hardware OS</h1>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <Link className="text-sm font-semibold text-slate-600 hover:text-primary-navy transition-colors" href="#features">Features</Link>
            <Link className="text-sm font-semibold text-slate-600 hover:text-primary-navy transition-colors" href="#how-it-works">How it Works</Link>
            <Link className="text-sm font-semibold text-slate-600 hover:text-primary-navy transition-colors" href="#network">Network</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-primary-navy px-4 py-2 hover:bg-slate-50 rounded-lg transition-all text-center">Sign In</Link>
            <Link href="/register" className="bg-primary-navy hover:bg-slate-800 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-all shadow-md text-center">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-light-bg py-24 lg:py-40">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-accent-blue/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/10 text-accent-blue text-[11px] font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
              </span>
              Now Live in Lagos State
            </div>
            <h2 className="text-5xl lg:text-7xl font-extrabold text-primary-navy leading-[1.05] tracking-tight">
              The OS for <br />
              <span className="text-accent-blue">Hardware Trading</span>
            </h2>
            <p className="text-lg lg:text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
              The premium B2B marketplace to streamline bulk procurement. Negotiate privately and trade securely with a vetted network of Lagos suppliers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="bg-primary-navy hover:bg-slate-800 text-white font-bold h-14 px-8 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg transition-all">
                Request Access
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <button className="bg-white hover:bg-slate-50 text-primary-navy font-bold h-14 px-8 rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-all">
                <span className="material-symbols-outlined">play_circle</span>
                Watch Demo
              </button>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-sm font-semibold mt-4">
              <div className="flex -space-x-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-9 w-9 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                    <img
                      alt="User"
                      className="h-full w-full object-cover"
                      src={i === 1
                        ? "https://lh3.googleusercontent.com/aida-public/AB6AXuA1Lp-qqihg_xTWwm2IMWQOsmlWgUqt4aZyiTj5YODnQ1GD4caDiDlxc6Qg-YsME7eZpttDzFXo9OSU6eso1B8wq05O_l1e0L2MlRZE47ASJxDdo5TQuUHj7EUo4_-K1X_8ijxmCipT_lByJDuVld8RZ1zriRVYYyQUmVZGCKrsrJLgpKipcd87w_zWIxfKviUZ2Vjmqhi4Eko_KPoHC5XQnfdTQvkcmTKGsijBvhlrQVfQ2AqIxyvsvjrqdvkohvUcS9aG0zWLVw"
                        : "https://lh3.googleusercontent.com/aida-public/AB6AXuDqJoYXSrVmuzG9m5D-xg5oI6GOrCbDOnDAthRDCBEWDWiPfOq3-R2Y73kobLUTLuU9CaUBtucNFawqvnafLBhp8cr2FxfE348307ihhtm3VZ3dQBvvLwVYiqX8IH3bqf7CSKwTooobJk7yBATMBA7vdu8wQaz6J6EvMhqSHXPFBIiri9j6PRbJh8gya9Zg5PsPQi8xBXqz8gZRKtuLubtnM51QIQUirxUzec4mRC3jQXI4GNVbGuRJPXvFV6Qj9GKWt-Sc-RKaXQ"
                      }
                    />
                  </div>
                ))}
                <div className="h-9 w-9 rounded-full border-2 border-white bg-accent-blue flex items-center justify-center text-[10px] text-white font-bold">+50</div>
              </div>
              Trusted by 50+ Major Merchants in Alaba and Mushin
            </div>
          </div>
          <div className="relative group">
            <div className="rounded-2xl bg-white p-2 border border-slate-100 shadow-soft group-hover:shadow-hover-soft transition-all duration-500">
              <img
                alt="Product Mockup"
                className="rounded-xl w-full h-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU11RKixa0c4DcfaiL7oesx6pOGUrfgGcxaPyYOEzbfaaElg9D-aMYOFuqvZO7LxBlmsiNBeZyTZrOcUkEk8l_vdPN-2BwQEy-tt1z2s-rbfb1CCqPBk4ck7MjUq1Bun5WGgzuQKQR7iFNMbofsTl_mS2jg_xrnUOhzOesVrZAIT9gxLJ4_36JZgYPkE34Zhku_b4qmhP-mU28xg_PKxqyyapSiYfafcAeujq_gYl57dGz2wyATPcuiQY569IY-rwgKi1dUYYnwQ"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white border border-slate-100 p-6 rounded-2xl shadow-xl flex items-center gap-4 max-w-[260px]">
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Trade Secured</p>
                <p className="text-primary-navy font-black text-lg">₦12.4M Verified</p>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-white border border-slate-100 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-bold text-slate-600">New RFQ from Alaba</span>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 border-b border-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12">Institutional Partners & Merchants</p>
          <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            {['LAGOS BUILD', 'NAIJA TOOLS', 'EQUIP NIG', 'ALABA PRO', 'METRO HARDWARE'].map((name) => (
              <div key={name} className="flex items-center font-black text-xl text-primary-navy">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing bg-white" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 max-w-2xl mx-auto">
            <h3 className="text-accent-blue font-bold text-sm uppercase tracking-widest mb-4">The Platform</h3>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-primary-navy mb-8 tracking-tight">Enterprise Infrastructure for Trade</h2>
            <p className="text-lg text-slate-500 font-medium">Built for high-volume traders who value speed, privacy, and verified reliability in the Nigerian market.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: 'shield_locked',
                title: 'Secure RFQ System',
                desc: 'Negotiate privately with suppliers. Zero public price lists ensuring your business margins remain confidential.'
              },
              {
                icon: 'bolt',
                title: 'Real-time Quoting',
                desc: 'Get instant responses from multiple vetted suppliers. Compare and close high-volume deals in minutes, not days.'
              },
              {
                icon: 'verified_user',
                title: 'Verified Network',
                desc: 'Every merchant on Hardware OS is thoroughly vetted for operational scale and quality standards.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group p-10 rounded-2xl card-light hover:border-accent-blue/30">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 text-primary-navy flex items-center justify-center mb-8 group-hover:bg-accent-blue group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                </div>
                <h4 className="text-2xl font-bold text-primary-navy mb-4">{feature.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="section-spacing bg-light-bg" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-start">
            {/* Buyer Workflow */}
            <div className="p-12 rounded-[2.5rem] bg-white shadow-soft">
              <span className="text-accent-blue font-bold text-xs uppercase tracking-[0.2em]">Procurement</span>
              <h2 className="text-4xl font-extrabold text-primary-navy mt-4 mb-12">Buyer Workflow</h2>
              <div className="space-y-12">
                {[
                  { title: 'Issue RFQ', desc: 'Define your hardware needs, volume, and logistics requirements instantly.' },
                  { title: 'Review Quotes', desc: 'Receive private, competitive offers from the top 10% of Lagos suppliers.' },
                  { title: 'Confirm & Release', desc: 'Funds held in escrow. Release payment only after successful inspection and delivery.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-primary-navy group-hover:bg-primary-navy group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-primary-navy mb-2">{step.title}</h5>
                      <p className="text-slate-500 font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Merchant Workflow */}
            <div className="p-12 rounded-[2.5rem] bg-white shadow-soft">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Distribution</span>
              <h2 className="text-4xl font-extrabold text-primary-navy mt-4 mb-12">Merchant Workflow</h2>
              <div className="space-y-12">
                {[
                  { title: 'Onboarding Vetting', desc: 'Verification of warehouse capacity and business documentation for trust.' },
                  { title: 'Bid on Volume', desc: 'Access high-value procurement requests that never hit the public market.' },
                  { title: 'Accelerated Growth', desc: 'Digital tools to manage hundreds of negotiations and payouts simultaneously.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-primary-navy group-hover:bg-primary-navy group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-primary-navy mb-2">{step.title}</h5>
                      <p className="text-slate-500 font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: '₦5B+', label: 'Trade Volume' },
            { value: '450+', label: 'Vetted Suppliers' },
            { value: '12k+', label: 'Monthly RFQs' },
            { value: '100%', label: 'Escrow Security' }
          ].map((stat, i) => (
            <div key={i} className="text-center p-12 bg-white rounded-3xl border border-slate-50 shadow-soft">
              <p className="text-5xl font-black text-primary-navy mb-3 tracking-tighter">{stat.value}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-primary-navy rounded-[3rem] p-16 lg:p-24 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-[0.03]">
              <img
                alt="Background pattern"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuECrXfIR3_Rk-lRpezkm9gBERECEImE9CyqC88ml1aAVSyh7rx69IZOq4z8QsTVHplZIIGaNE-tgukHayRpTan-x0X4w0Oof-GIKemN0MXecCwe6bk-SYUg2CZq5cgfL7vCwqqzv-d4qGlfnjTHSd0wTma1b4LG9BL2PaaqqFsxfsodUbkAGdbB28U-ML7E7mqw31gZkRHvF69tH2vcgOl9vZYcRu7A0KgbPKr6HZ2n65VowpsUbP5bUKVehTsl46RUELotxHGQ"
              />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl lg:text-6xl font-extrabold mb-10 tracking-tight">Digitize Your Trading Operations Today</h2>
              <p className="text-xl text-slate-300 mb-12 font-medium">Join the exclusive waitlist for priority access to the Hardware OS network in Lagos.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <input
                  className="h-16 px-8 rounded-2xl text-primary-navy w-full sm:w-96 focus:ring-4 focus:ring-accent-blue border-none font-semibold"
                  placeholder="Work email address"
                  type="email"
                />
                <button className="h-16 bg-white hover:bg-slate-100 text-primary-navy font-bold px-12 rounded-2xl transition-all shadow-xl">
                  Request Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-16">
          <div className="col-span-2">
            <div className="flex items-center gap-3 text-primary-navy mb-8">
              <div className="bg-primary-navy p-1.5 rounded-lg text-white">
                <span className="material-symbols-outlined text-xl">settings_input_component</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Hardware OS</h2>
            </div>
            <p className="max-w-sm mb-10 font-medium leading-relaxed">The operating system for the Nigerian hardware trade. Streamlining industrial procurement from Alaba to the world.</p>
            <div className="flex gap-4">
              <Link className="h-11 w-11 rounded-full bg-slate-50 flex items-center justify-center hover:bg-primary-navy hover:text-white transition-all text-primary-navy" href="#">
                <span className="material-symbols-outlined text-xl">public</span>
              </Link>
              <Link className="h-11 w-11 rounded-full bg-slate-50 flex items-center justify-center hover:bg-primary-navy hover:text-white transition-all text-primary-navy" href="#">
                <span className="material-symbols-outlined text-xl">mail</span>
              </Link>
            </div>
          </div>
          <div>
            <h5 className="text-primary-navy font-black text-sm uppercase tracking-widest mb-8">Platform</h5>
            <ul className="space-y-4 font-bold text-sm">
              <li><Link className="hover:text-accent-blue transition-colors" href="#">For Buyers</Link></li>
              <li><Link className="hover:text-accent-blue transition-colors" href="#">For Suppliers</Link></li>
              <li><Link className="hover:text-accent-blue transition-colors" href="#">Trade Security</Link></li>
              <li><Link className="hover:text-accent-blue transition-colors" href="#">Verification Hub</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-primary-navy font-black text-sm uppercase tracking-widest mb-8">Company</h5>
            <ul className="space-y-4 font-bold text-sm">
              <li><Link className="hover:text-accent-blue transition-colors" href="#">Our Story</Link></li>
              <li><Link className="hover:text-accent-blue transition-colors" href="#">Press Kit</Link></li>
              <li><Link className="hover:text-accent-blue transition-colors" href="#">Contact</Link></li>
              <li><Link className="hover:text-accent-blue transition-colors" href="#">Privacy Hub</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-24 pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-400">
          <p>© 2024 Hardware OS Technologies. All rights reserved.</p>
          <div className="flex gap-8">
            <p>Designed for Lagos</p>
            <p>Built for Scale</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
