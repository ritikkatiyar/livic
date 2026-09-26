package com.livic.ai.tools;

/**
 * What a tool does mechanically (docs/AI_ARCHITECTURE_DESIGN.md §32).
 * Only READ tools run until the approval flow exists.
 */
public enum ToolCapability {
    READ,
    WRITE,
    DESTRUCTIVE,
    EXTERNAL_SIDE_EFFECT
}
