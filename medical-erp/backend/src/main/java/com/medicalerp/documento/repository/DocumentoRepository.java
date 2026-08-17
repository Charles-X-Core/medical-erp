package com.medicalerp.documento.repository;

import com.medicalerp.documento.entity.Documento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, Long> {

    Page<Documento> findByPacienteId(Long pacienteId, Pageable pageable);

    Page<Documento> findByPacienteIdAndTipo(Long pacienteId, String tipo, Pageable pageable);

    List<Documento> findByPacienteId(Long pacienteId);

    Page<Documento> findByEstado(String estado, Pageable pageable);

}
