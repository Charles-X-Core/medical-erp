package com.medicalerp.seguridad.repository;

import com.medicalerp.seguridad.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

/**
 * OTP Code Repository (SEC-OTP-002)
 */
@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByEmailAndUsadoFalseOrderByCreatedAtDesc(String email);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.expiraAt < :now")
    int deleteAllExpired(@Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.createdAt < :olderThan")
    int deleteAllOlderThan(@Param("olderThan") Instant olderThan);

    @Query("SELECT COUNT(o) FROM OtpCode o WHERE o.email = :email AND o.createdAt >= :since")
    long countRecentByEmail(@Param("email") String email, @Param("since") Instant since);

}
