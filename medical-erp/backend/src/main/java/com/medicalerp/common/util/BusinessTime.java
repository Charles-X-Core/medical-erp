package com.medicalerp.common.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Central business timezone constant.
 * All business time operations MUST use this zone.
 */
public final class BusinessTime {

    public static final ZoneId ZONE = ZoneId.of("America/Los_Angeles");

    private BusinessTime() {}

    /** Current instant (UTC epoch). Use for timestamps, comparisons, durations. */
    public static Instant now() {
        return Instant.now();
    }

    /** Today's date in business timezone. Use for "citas de hoy", date filtering. */
    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    /** Current date+time in business timezone. Use for business datetime comparisons. */
    public static LocalDateTime currentDateTime() {
        return LocalDateTime.now(ZONE);
    }

    /** Convert a business LocalDateTime to an Instant (for storage). */
    public static Instant toInstant(LocalDateTime businessDateTime) {
        if (businessDateTime == null) return null;
        return businessDateTime.atZone(ZONE).toInstant();
    }

    /** Convert an Instant to a business LocalDateTime (for display). */
    public static LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZONE).toLocalDateTime();
    }

    /** Convert an Instant to a business LocalDate (for display). */
    public static LocalDate toLocalDate(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZONE).toLocalDate();
    }
}
