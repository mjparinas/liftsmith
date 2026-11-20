package com.getliftsmith.app.wear;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class PhoneLinkTest {

    @Test
    public void aPhoneWithTheAppIsReady() {
        assertEquals(PhoneLink.Status.READY, PhoneLink.statusOf(1, 1));
        assertEquals(PhoneLink.Status.READY, PhoneLink.statusOf(2, 1));
    }

    @Test
    public void aPhoneWithoutTheAppIsAskedToInstallIt() {
        assertEquals(PhoneLink.Status.NO_APP, PhoneLink.statusOf(1, 0));
    }

    @Test
    public void noPhoneIsOffline() {
        assertEquals(PhoneLink.Status.OFFLINE, PhoneLink.statusOf(0, 0));
    }
}
