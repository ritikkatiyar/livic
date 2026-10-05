package com.livic.platform.storage.repository;

import com.livic.platform.storage.domain.MediaAssetTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAssetTbl, UUID> {

    List<MediaAssetTbl> findAllByOwnerModuleAndReferenceId(String ownerModule, UUID referenceId);

    List<MediaAssetTbl> findAllByOwnerModuleAndReferenceIdIn(String ownerModule, Collection<UUID> referenceIds);

}
