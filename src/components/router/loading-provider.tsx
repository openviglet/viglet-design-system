import { Skeleton } from "@/components/ui/skeleton";
import { IconAlertTriangleFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { GradientButtonLink } from "./gradient-button-link";

/**
 * The error slate, exactly as `BlankSlate` drew it.
 *
 * VDS147 removed the console-era exports, and this was their last caller inside
 * the package. The markup lives here rather than on a subpath because nothing
 * else may reach for it, and it is a copy rather than a `BentoEmptyState`
 * because this component ships on `./router`: the bento look is in `bento.css`,
 * which is opt-in, so borrowing it would leave a consumer taking only `./styles`
 * with an unstyled error. A page that wants the bento look renders
 * `BentoEmptyState` itself.
 */
function ErrorSlate({
    title,
    description,
    buttonText,
    urlNew,
}: Readonly<{ title: string; description: string; buttonText: string; urlNew?: string }>) {
    return (
        <div className="flex items-center justify-center px-6 py-16">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
                <div className="relative flex flex-col items-center text-center px-8 py-12 space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--vg-accent-surface-strong)] to-[var(--vg-accent-surface-strong)] blur-xl animate-pulse" />
                        <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br vg-accent-solid shadow-lg shadow-[var(--vg-accent-line)] ring-4 ring-[var(--vg-accent-surface)]">
                            <IconAlertTriangleFilled className="text-white" size={30} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                            {description}
                        </p>
                    </div>

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

interface LoadProviderProps {
    /**
     * The value the page is waiting on. Only its presence is read — the
     * skeleton shows while this is `undefined` — so it is deliberately
     * untyped rather than `any`, which would let a caller's mistake through.
     */
    checkIsNotUndefined?: unknown;
    error?: string | null;
    tryAgainUrl?: string;
    children: React.ReactNode;
}

/**
 * A page's loading gate: a skeleton until `checkIsNotUndefined` has a value, an
 * error slate with a retry link when `error` is set, and its children after that.
 */
export const LoadProvider = ({
    checkIsNotUndefined,
    error,
    tryAgainUrl,
    children
}: LoadProviderProps) => {
    const { t } = useTranslation();

    if (error) {
        return (
            <ErrorSlate
                title={t("common.errorLoading")}
                description={error}
                buttonText={t("common.tryAgain")}
                urlNew={tryAgainUrl}
            />
        );
    }

    if (checkIsNotUndefined === undefined && !error) {
        return (
            <div className="space-y-6 py-8 px-6 animate-pulse">
                <Skeleton className="h-8 w-1/3 rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
                        <div key={key} className="space-y-3 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    ))}
                </div>
                <div className="pt-4">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
            </div>
        );
    }
    return <>{children}</>;
};
