package com.medicalerp.consulta.repository;

import com.medicalerp.consulta.entity.Consulta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    Page<Consulta> findByHistoriaId(Long historiaId, Pageable pageable);

    List<Consulta> findByHistoriaId(Long historiaId);

    Page<Consulta> findByCitaId(Long citaId, Pageable pageable);

}
