package com.livic.services.finance.dto;

   import jakarta.validation.constraints.NotBlank;
   import jakarta.validation.constraints.NotNull;
   import jakarta.validation.constraints.Positive;
   import java.math.BigDecimal;
   import java.time.LocalDate;
   import java.time.LocalDateTime;
   import java.util.UUID;

   public class UnitBookingDTOs {

       public record CreateBookingRequest(
               @NotNull UUID unitId,
               @NotNull UUID propertyId,
               UUID prospectiveTenantUserId,
               @NotBlank String prospectiveTenantName,
               @NotBlank String prospectiveTenantPhone,
               String prospectiveTenantEmail,
               @NotNull @Positive BigDecimal tokenAmount,
               @NotNull LocalDate expectedMoveInDate
       ) {}

       /** A booking whose token amount has already been paid, e.g. through a marketplace lead. */
       public record PaidBookingRequest(
               @NotNull UUID unitId,
               @NotBlank String prospectiveTenantName,
               @NotBlank String prospectiveTenantPhone,
               String prospectiveTenantEmail,
               @NotNull @Positive BigDecimal tokenAmount,
               @NotNull LocalDate expectedMoveInDate,
               @NotNull UUID paymentTransactionId
       ) {}

       public record UnitBookingResponse(
               UUID id,
               UUID unitId,
               String unitNumber,
               UUID prospectiveTenantUserId,
               String prospectiveTenantName,
               String prospectiveTenantPhone,
               String prospectiveTenantEmail,
               BigDecimal tokenAmount,
               LocalDate expectedMoveInDate,
               String status,
               UUID paymentTransactionId,
               UUID convertedLeaseId,
               LocalDateTime createdAt,
               LocalDateTime updatedAt
       ) {}
   }
   
