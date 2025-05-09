package com.nirapod.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "usr_user")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @Column(name = "NID", length = 10)
    private String nid;

    @Column(name = "Categories", length = 16, nullable = false)
    private String categories;

    @Column(name = "Email", nullable = false)
    private String email;

    @Column(name = "Password", nullable = false)
    private String password;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "Phone", nullable = false)
    private String phone;

    @Column(name = "Present_address", nullable = false)
    private String presentAddress;

    @Column(name = "Permanent_address", nullable = false)
    private String permanentAddress;

    @Column(name = "Passport")
    private String passport;

    @Column(name = "Passport_img")
    private String passportImg;

    @Column(name = "Driving_License")
    private String drivingLicense;

    @Column(name = "Driving_License_img")
    private String drivingLicenseImg;

    @Column(name = "Utility_bill_customer_ID", nullable = false)
    private String utilityBillCustomerId;

    @Column(name = "Utility_bill_photo", nullable = false)
    private String utilityBillPhoto;

    @Column(name = "User_photo", nullable = false)
    private String userPhoto;

    @Column(name = "NID_photo", nullable = false)
    private String nidPhoto;

    @Column(name = "priv_user_ID")
    private String privUserId;

    @Column(name = "priv_user_ID_photo")
    private String privUserIdPhoto;

    public String getUtilityBillCustomerID() {
        return this.utilityBillCustomerId;
    }
}
