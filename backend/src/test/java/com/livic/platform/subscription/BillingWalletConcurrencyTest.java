package com.livic.platform.subscription;

import com.livic.platform.subscription.domain.BillingWalletTbl;
import com.livic.platform.subscription.repository.BillingWalletRepository;
import com.livic.platform.subscription.repository.WalletTransactionRepository;
import com.livic.platform.subscription.service.interfaces.BillingWalletService;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("dev")
public class BillingWalletConcurrencyTest {

    @Autowired
    private BillingWalletService walletService;

    @Autowired
    private BillingWalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    private UUID testUserId;

    @BeforeEach
    public void setUp() {
        UserTbl user = UserTbl.builder()
                .authUid(UUID.randomUUID().toString())
                .fullName("Test User")
                .phoneNumber(UUID.randomUUID().toString().substring(0, 10))
                .failedLoginAttempts(0)
                .build();
        user = userRepository.save(user);
        testUserId = user.getId();

        // Setup initial wallet with exactly 100 credits
        BillingWalletTbl wallet = BillingWalletTbl.builder()
                .userId(testUserId)
                .creditBalance(BigDecimal.valueOf(100.00))
                .currency("USD")
                .build();
        walletRepository.save(wallet);
    }

    @Test
    public void testConcurrentWalletDebits() throws InterruptedException {
        int numberOfThreads = 20;
        double debitAmountPerThread = 5.00; // Total 20 * 5 = 100 credits

        ExecutorService service = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successfulDebits = new AtomicInteger(0);
        AtomicInteger failedDebits = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            service.execute(() -> {
                try {
                    // Perform thread-safe concurrent debit
                    walletService.debitWallet(testUserId, debitAmountPerThread, "CONCURRENT_TEST_DEBIT");
                    successfulDebits.incrementAndGet();
                } catch (Exception e) {
                    failedDebits.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        service.shutdown();

        // 1. Verify that all 20 threads successfully debited without any deadlock or race condition
        assertEquals(20, successfulDebits.get(), "All parallel debits should succeed");
        assertEquals(0, failedDebits.get(), "No debit should fail due to lock timeouts");

        // 2. Verify that the remaining balance is exactly 0.00
        double remainingBalance = walletService.getRemainingBalance(testUserId);
        assertEquals(0.00, remainingBalance, 0.0001, "Remaining balance must be exactly 0");
    }
}
