package com.telemed.backend.model;

import com.telemed.backend.model.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor; // <--- Add this
import lombok.Builder;           // <--- Add this
import lombok.Data;
import lombok.NoArgsConstructor; // <--- Add this
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@Builder             // <--- Creates User.builder()
@NoArgsConstructor   // <--- Required for JPA (Hibernate)
@AllArgsConstructor  // <--- Required for @Builder to work
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // --- ADD THIS FIELD ---
    @Column(name = "full_name") // Maps to the database column "full_name"
    private String fullName;
    //
    private String email;
    @Column(name = "password_hash")
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    // --- UserDetails Methods ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}