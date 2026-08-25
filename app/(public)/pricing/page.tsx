import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
    const tiers = [
        {
            name: "Walk-in / Casual",
            price: "₱800",
            period: "/ hour",
            description: "Perfect for occasional players looking for a quick game.",
            features: ["Standard court access", "Book up to 3 days in advance", "Access to lounge area"],
            cta: "Book Now",
            href: "/book",
            highlighted: false,
        },
        {
            name: "Smash Pro Member",
            price: "₱3,500",
            period: "/ month",
            description: "For the dedicated player wanting priority and perks.",
            features: [
                "4 hours of court time included",
                "Discounted additional hours (₱600/hr)",
                "Book up to 14 days in advance",
                "Free paddle rentals",
            ],
            cta: "Become a Member",
            href: "/signup",
            highlighted: true,
        },
    ];

    return (
        <div className="max-w-5xl mx-auto w-full px-4 py-16 md:py-24">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                    Simple, transparent pricing
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Whether you play once a month or every day, we have a plan that fits your game.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {tiers.map((tier) => (
                    <Card
                        key={tier.name}
                        className={`flex flex-col ${tier.highlighted ? "border-emerald-500 shadow-lg relative" : "border-slate-200"}`}
                    >
                        {tier.highlighted && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <span className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                                    Most Popular
                                </span>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl">{tier.name}</CardTitle>
                            <CardDescription className="min-h-[40px]">{tier.description}</CardDescription>
                            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                                {tier.price}
                                <span className="ml-1 text-xl font-medium text-slate-500">{tier.period}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-4">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-center">
                                        <Check className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
                                        <span className="text-slate-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href={tier.href} className="w-full">
                                <Button
                                    className={`w-full ${tier.highlighted ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                                    variant={tier.highlighted ? "default" : "outline"}
                                    size="lg"
                                >
                                    {tier.cta}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}