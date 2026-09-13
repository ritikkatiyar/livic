package com.livic.platform.common.service.interfaces;

import java.util.List;
import java.util.Optional;

public interface CrudService<T, ID> {
    T save(T entity);
    T saveAndFlush(T entity);
    List<T> saveAll(Iterable<T> entities);
    Optional<T> findById(ID id);
    List<T> findAll();
    List<T> findAllById(Iterable<ID> ids);
    void deleteById(ID id);
    void delete(T entity);
    void deleteAll(Iterable<? extends T> entities);
    boolean existsById(ID id);
}
