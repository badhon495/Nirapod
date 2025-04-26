package com.nirapod.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "usr_complain")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateComplain {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tracking_ID")
    private Long trackingId;

    @Column(name = "NID")
    private String nid;

    @Column(name = "Urgency")
    private String urgency;

    @Column(name = "Complain_to")
    private String complainTo;

    @Column(name = "District")
    private String district;

    @Column(name = "Area")
    private String area;

    @Column(name = "Tags")
    private String tags;

    @Column(name = "Details")
    private String details;

    @Column(name = "Photos")
    private String photos;

    @Column(name = "Post_on_timeline")
    private Boolean postOnTimeline;

    @Column(name = "Location")
    private String location;

    @Column(name = "Update")
    private String update;

    @Column(name = "Status")
    private Integer status;

    @Column(name = "follow")
    private String follow;

    @Column(name = "comment")
    private String comment;
}
