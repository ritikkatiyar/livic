package com.livic.common.subscription;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface EnforceSubscription {
    FeatureKey feature();
}
