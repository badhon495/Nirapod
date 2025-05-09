package com.nirapod.controller;

import com.nirapod.dto.ComplaintResponse;
import com.nirapod.model.Complaint;
import com.nirapod.repository.ComplaintRepository;
import com.nirapod.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class ComplaintController {
    private static final Logger logger = LoggerFactory.getLogger(ComplaintController.class);

    @Autowired
    private ComplaintRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    // Fetch all complaints
    @GetMapping("/complaints")
    public List<ComplaintResponse> getAllComplaints(
            @RequestHeader(value = "X-User-Category", required = false) String userCategory) {
        logger.info("Fetching all complaints");
        List<Complaint> complaints;
        if (userCategory != null && userCategory.equalsIgnoreCase("police")) {
            logger.info("User is police, returning only police complaints");
            complaints = repository.findByComplainToIgnoreCase("Police");
        }
// ##Do not change plz (Faishal)
        else if (userCategory != null && userCategory.equalsIgnoreCase("fire")) {
            logger.info("User is fire, returning only fire complaints");
            complaints = repository.findByComplainToIgnoreCase("Fire");
        }

        else if (userCategory != null && userCategory.equalsIgnoreCase("city")) {
            logger.info("User is fire, returning only fire complaints");
            complaints = repository.findByComplainToIgnoreCase("City");
        }

        else if (userCategory != null && userCategory.equalsIgnoreCase("animal")) {
            logger.info("User is fire, returning only fire complaints");
            complaints = repository.findByComplainToIgnoreCase("Animal");
        }






        else {
            complaints = repository.findAll();
        }
        logger.info("Fetched {} complaints", complaints.size());
        // Map to ComplaintResponse with user name and time
        List<ComplaintResponse> responseList = new java.util.ArrayList<>();
        for (Complaint c : complaints) {
            String userName = userRepository.findByNid(c.getNid())
                    .map(u -> u.getName())
                    .orElse("");
            responseList.add(new ComplaintResponse(
                    c.getTrackingId(),
                    userName,
                    c.getUrgency(),
                    c.getComplainTo(),
                    c.getDistrict(),
                    c.getArea(),
                    c.getTags(),
                    c.getDetails(),
                    c.getPhotos(),
                    c.isPostOnTimeline(),
                    c.getLocation(),
                    c.getUpdateNote(),
                    c.getStatus(),
                    c.getFollow(),
                    c.getComment(),
                    c.getTime() // <-- Make sure this is c.getTime()
            ));
        }
        return responseList;
    }

    // Fetch all police complaints
    @GetMapping("/complaints/police")
    public List<Complaint> getPoliceComplaints() {
        logger.info("Fetching all police complaints");
        List<Complaint> complaints = repository.findByComplainToIgnoreCase("Police");
        logger.info("Fetched {} police complaints", complaints.size());
        return complaints;
    }

    // Fetch all reported complaints
    @GetMapping("/complaints/reported")
    public List<ComplaintResponse> getReportedComplaints() {
        List<Complaint> complaints = repository.findAll();
        List<ComplaintResponse> responseList = new ArrayList<>();
        for (Complaint c : complaints) {
            if (c.getReport() != null && !c.getReport().trim().isEmpty()) {
                String userName = userRepository.findByNid(c.getNid())
                        .map(u -> u.getName())
                        .orElse("");
                responseList.add(new ComplaintResponse(
                        c.getTrackingId(),
                        userName,
                        c.getUrgency(),
                        c.getComplainTo(),
                        c.getDistrict(),
                        c.getArea(),
                        c.getTags(),
                        c.getDetails(),
                        c.getPhotos(),
                        c.isPostOnTimeline(),
                        c.getLocation(),
                        c.getUpdateNote(),
                        c.getStatus(),
                        c.getFollow(),
                        c.getComment(),
                        c.getTime(),
                        c.getReport() // Add report field for frontend
                ));
            }
        }
        return responseList;
    }

    // Fetch a complaint by ID
    @GetMapping("/complaint/{id}")
    public ResponseEntity<Complaint> getComplaintById(@PathVariable Integer id) {
        logger.info("Fetching complaint with id: {}", id);
        Optional<Complaint> complaint = repository.findById(id);
        if (complaint.isPresent()) {
            logger.info("Complaint found with id: {}", id);
            return ResponseEntity.ok(complaint.get());
        } else {
            logger.warn("Complaint with id {} not found", id);
            return ResponseEntity.notFound().build();
        }
    }

    // Fetch all complaints for a specific user
    @GetMapping("/complaints/user/{nid}")
    public List<ComplaintResponse> getComplaintsByUser(@PathVariable String nid) {
        List<Complaint> complaints = repository.findAll()
                .stream()
                .filter(c -> c.getNid().equals(nid))
                .toList();
        List<ComplaintResponse> responseList = new ArrayList<>();
        for (Complaint c : complaints) {
            String userName = userRepository.findByNid(c.getNid())
                    .map(u -> u.getName())
                    .orElse("");
            responseList.add(new ComplaintResponse(
                    c.getTrackingId(),
                    userName,
                    c.getUrgency(),
                    c.getComplainTo(),
                    c.getDistrict(),
                    c.getArea(),
                    c.getTags(),
                    c.getDetails(),
                    c.getPhotos(),
                    c.isPostOnTimeline(),
                    c.getLocation(),
                    c.getUpdateNote(),
                    c.getStatus(),
                    c.getFollow(),
                    c.getComment(),
                    c.getTime()));
        }
        return responseList;
    }

    // Update a complaint's status and update note
    @PutMapping("/complaint/update/{id}")
    public ResponseEntity<Complaint> updateComplaint(@PathVariable Integer id,
            @RequestBody Map<String, Object> updates) {
        logger.info("Updating complaint with id: {}", id);
        Optional<Complaint> existingComplaint = repository.findById(id);
        if (existingComplaint.isPresent()) {
            Complaint complaint = existingComplaint.get();

            // Partial update: only update fields present in the request
            if (updates.containsKey("status")) {
                Object statusObj = updates.get("status");
                if (statusObj instanceof Number) {
                    complaint.setStatus(((Number) statusObj).intValue());
                } else if (statusObj instanceof String) {
                    String statusText = (String) statusObj;
                    if (statusText.equalsIgnoreCase("Solved")) {
                        complaint.setStatus(2);
                    } else if (statusText.equalsIgnoreCase("In Progress")) {
                        complaint.setStatus(1);
                    } else {
                        complaint.setStatus(0);
                    }
                }
            }
            if (updates.containsKey("updateNote")) {
                complaint.setUpdateNote((String) updates.get("updateNote"));
            }
            if (updates.containsKey("comment")) {
                complaint.setComment((String) updates.get("comment"));
            }
            if (updates.containsKey("report")) {
                complaint.setReport((String) updates.get("report"));
            }
            Complaint updated = repository.save(complaint);
            logger.info("Complaint with id {} updated successfully", id);
            return ResponseEntity.ok(updated);
        } else {
            logger.warn("Complaint with id {} not found for update", id);
            return ResponseEntity.notFound().build();
        }
    }

    // Add a new complaint
    @PostMapping("/complaint")
    public ResponseEntity<Complaint> addComplaint(@RequestBody Complaint complaint) {
        try {
            logger.info("Adding new complaint");

            // Set default status if not provided
            if (complaint.getStatus() == null) {
                complaint.setStatus(0); // Unsolved by default
            }

            Complaint savedComplaint = repository.save(complaint);
            logger.info("Complaint added successfully with id: {}", savedComplaint.getTrackingId());
            return ResponseEntity.status(201).body(savedComplaint);
        } catch (Exception e) {
            logger.error("Error adding complaint: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/complaint/upload-photos")
    public ResponseEntity<?> uploadPhotos(
            @RequestParam("trackingId") Integer trackingId,
            @RequestParam("nid") String nid,
            @RequestParam("photos") java.util.List<MultipartFile> photos) throws IOException {
        Optional<Complaint> complaintOpt = repository.findById(trackingId);
        if (complaintOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Complaint not found");
        }
        Complaint complaint = complaintOpt.get();
        // Save files
        Path dirPath = Paths.get(uploadDir);
        if (!Files.exists(dirPath))
            Files.createDirectories(dirPath);
        java.util.List<String> photoPaths = new ArrayList<>();
        for (MultipartFile file : photos) {
            if (!file.isEmpty()) {
                String filename = System.currentTimeMillis() + "_"
                        + org.springframework.util.StringUtils.cleanPath(file.getOriginalFilename());
                Path filePath = dirPath.resolve(filename);
                file.transferTo(filePath);
                photoPaths.add("/uploads/" + filename);
            }
        }
        // Append to existing photos
        String existingPhotos = complaint.getPhotos();
        String newPhotos = String.join(",", photoPaths);
        if (existingPhotos != null && !existingPhotos.isBlank()) {
            complaint.setPhotos(existingPhotos + "," + newPhotos);
        } else {
            complaint.setPhotos(newPhotos);
        }
        repository.save(complaint);
        return ResponseEntity.ok(Map.of("success", true, "photos", complaint.getPhotos()));
    }

    // Delete a complaint by ID
    @DeleteMapping("/complaint/{id}")
    public ResponseEntity<?> deleteComplaint(@PathVariable Integer id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(404).body("Complaint not found");
        }
        repository.deleteById(id);
        return ResponseEntity.ok().body("Complaint deleted successfully");
    }
}