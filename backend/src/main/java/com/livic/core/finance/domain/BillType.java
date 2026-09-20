package com.livic.core.finance.domain;

/**
 * What kind of debt this bill is — which is to say, which payer owes which issuer.
 *
 * <p>The discriminator is the payer/issuer pair, not the kind of charge. Two bills exist for
 * a rented-out flat because the owner owes the property and the tenant owes the owner. When
 * the payer and issuer are the same, it is one bill with more lines: parking and a late fee
 * are {@code bill_line} rows on the maintenance bill, never bills of their own. Keep this
 * enum small or the service rots into branching on type.
 */
public enum BillType {
    /** Tenant pays rent — to the property in a rental, to the owner in a rented-out flat. */
    RENT,
    /** Owner pays the building for upkeep. */
    MAINTENANCE
}
