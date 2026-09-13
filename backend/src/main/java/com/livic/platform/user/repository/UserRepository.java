package com.livic.platform.user.repository;

import com.livic.platform.user.domain.UserTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserTbl, UUID> {
    Optional<UserTbl> findByAuthUid(String authUid);
    Optional<UserTbl> findByPhoneNumber(String phoneNumber);
    List<UserTbl> findTop10ByPhoneNumberContaining(String phoneNumber);

    @Query("SELECT u.id FROM UserTbl u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :pattern, '%')) OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :pattern, '%'))")
    List<UUID> findIdsByFullNameOrPhonePattern(@Param("pattern") String pattern);
}
