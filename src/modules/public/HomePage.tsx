import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-32 px-6 lg:px-10 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          Build something amazing, <span className="text-primary">faster</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          A modern full-stack platform to power your next project. Simple, fast,
          and ready to scale.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/register">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 lg:px-10 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Optimized for speed with server-side rendering and smart caching out of the box.",
              },
              {
                icon: Shield,
                title: "Secure by Default",
                desc: "Built-in authentication, role-based access control, and data validation.",
              },
              {
                icon: BarChart3,
                title: "Admin Dashboard",
                desc: "A powerful admin panel to manage users, content, and settings with ease.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
              >
                <f.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-10 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Create your account in seconds and start building today.
        </p>
        <Button size="lg" asChild>
          <Link href="/register">
            Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
