import React from "react";
import { GradientButtonLink } from "./gradient-button-link";

interface Props {
    icon: React.ElementType
    title: string;
    description: string;
    buttonText: string;
    urlNew?: string;
}

/**
 * The console empty state.
 *
 * @deprecated Console-era chrome. Still exported and still supported - the
 * cutover has not started in any of the three consoles, and removal is its own
 * decision, not a side effect of this notice. New pages should use the
 * bento layer.
 *
 * @see BentoEmptyState - the bento equivalent.
 */
export const BlankSlate: React.FC<Props> = ({ icon: Icon, title, description, urlNew, buttonText }) => {
    return (
        <div className="flex items-center justify-center px-6 py-16">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
                <div className="relative flex flex-col items-center text-center px-8 py-12 space-y-6">
                    {/* Icon with animated ring */}
                    <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--vg-accent-surface-strong)] to-[var(--vg-accent-surface-strong)] blur-xl animate-pulse" />
                        <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br vg-accent-solid shadow-lg shadow-[var(--vg-accent-line)] ring-4 ring-[var(--vg-accent-surface)]">
                            <Icon className="text-white" size={30} />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                            {description}
                        </p>
                    </div>

                    {/* CTA */}
                    {urlNew && (
                        <GradientButtonLink size="lg" to={urlNew}>
                            {buttonText}
                        </GradientButtonLink>
                    )}
                </div>
            </div>
        </div>
    );
}
