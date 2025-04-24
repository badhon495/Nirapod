package com.nirapod.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @Column(unique = true)
    private String phoneNumber;
    @Column(unique = true)
    private String email;
    private String password;
    private String userType; // NORMAL, PRIVILEGED, ADMIN
    private String nid;
    private String presentAddress;
    private String permanentAddress;
    private String drivingLicence;
    private String passport;
    private String affiliation; // Police Dept, Fire Dept, City Corp, Animal Shelter
    private String identificationNumber;
    private String registrationNumber;
    private String status; // PENDING, APPROVED, REJECTED
    private String photoPath;
    private String nidFilePath;
    private String drivingLicenceFilePath;
    private String passportFilePath;
    private String utilityBillFilePath;
    private String affiliationDocPath;
}
