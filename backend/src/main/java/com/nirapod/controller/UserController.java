package com.nirapod.controller;

import com.nirapod.model.User;
import com.nirapod.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/by-identifier")
    public ResponseEntity<?> getUserByIdentifier(@RequestParam("value") String value) {
        Optional<User> userOpt = userRepository.findByNid(value);
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findByPhone(value);
        }
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findByEmail(value);
        }
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        User user = userOpt.get();
        Map<String, String> result = new HashMap<>();
        result.put("nid", user.getNid());
        result.put("phone", user.getPhone());
        result.put("email", user.getEmail());
        result.put("name", user.getName());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUser(
            @RequestParam(required = false) String nid,
            @RequestParam(required = false) String drivingLicence,
            @RequestParam(required = false) String passport) {
        Optional<User> userOpt = Optional.empty();
        if (nid != null && !nid.isEmpty()) {
            userOpt = userRepository.findByNid(nid);
        } else if (drivingLicence != null && !drivingLicence.isEmpty()) {
            userOpt = userRepository.findByDrivingLicense(drivingLicence);
        } else if (passport != null && !passport.isEmpty()) {
            userOpt = userRepository.findByPassport(passport);
        }
        if (userOpt.isPresent()) {
            User u = userOpt.get();
            Map<String, Object> result = new HashMap<>();
            result.put("name", u.getName());
            result.put("nid", u.getNid());
            result.put("passport", u.getPassport());
            result.put("drivingLicence", u.getDrivingLicense());
            result.put("presentAddress", u.getPresentAddress());
            result.put("permanentAddress", u.getPermanentAddress());
            result.put("email", u.getEmail());
            result.put("phone", u.getPhone());
            result.put("utilityBillId", u.getUtilityBillCustomerID());
            result.put("utilityBillPhoto", u.getUtilityBillPhoto());
            result.put("userPhoto", u.getUserPhoto());
            result.put("nidPhoto", u.getNidPhoto());
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }
}
