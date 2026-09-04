/**
 * The App Router runs on React's canary channel, which is where
 * `<ViewTransition>` lives; @types/react keeps those declarations in a separate
 * entry so that stable-channel projects do not see them. Referencing it here is
 * what lets `import { ViewTransition } from "react"` type-check.
 */
/// <reference types="react/canary" />
