package com.booknest.backend.repository;

import com.booknest.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByStudentId(String studentId);

    boolean existsByEmail(String email);

    boolean existsByStudentId(String studentId);

    Page<User> findByRole(User.Role role, Pageable pageable);
}
