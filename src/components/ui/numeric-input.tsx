"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface NumericInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    allowDecimals?: boolean;
}

/**
 * NumericInput - A text input that only accepts numeric values.
 * Uses type="text" with inputMode="numeric" to avoid scroll-wheel issues.
 * Filters non-numeric characters via regex on change.
 */
const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
    ({ className, onChange, allowDecimals = false, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;

            // Allow empty string, numbers, and optionally decimals
            const regex = allowDecimals ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;

            if (regex.test(value)) {
                onChange?.(e);
            }
        };

        return (
            <input
                type="text"
                inputMode="numeric"
                pattern={allowDecimals ? "[0-9]*\\.?[0-9]*" : "[0-9]*"}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                onChange={handleChange}
                {...props}
            />
        );
    }
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
