/**
 * Database Service
 * PostgreSQL persistence for cached buildings
 * Uses PostGIS for geographic queries
 */

import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { CachedBuilding, Coordinates } from '../types/services.types';

/**
 * Insert or update a building in the cache
 * @param building - Building data to cache
 * @returns ID of the cached building
 */
export async function saveBuildingToDatabase(
  building: Omit<CachedBuilding, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const client = await pool.connect();

  try {
    // First check if building already exists
    let existingId: string | null = null;
    if (building.externalId) {
      const existing = await getBuildingByExternalId(building.externalId, building.source);
      existingId = existing?.id || null;
    }

    let query: string;
    let values: any[];

    if (existingId) {
      // Update existing building
      query = `
        UPDATE cached_buildings
        SET
          name = $1,
          address = $2,
          location = ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
          metadata = $5,
          updated_at = NOW(),
          expires_at = $6
        WHERE id = $7
        RETURNING id
      `;
      values = [
        building.name || null,
        building.address,
        building.longitude,
        building.latitude,
        building.metadata ? JSON.stringify(building.metadata) : null,
        building.expiresAt || null,
        existingId,
      ];
    } else {
      // Insert new building
      query = `
        INSERT INTO cached_buildings (
          external_id,
          source,
          name,
          address,
          location,
          metadata,
          expires_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
          $7,
          $8
        )
        RETURNING id
      `;
      values = [
        building.externalId || null,
        building.source,
        building.name || null,
        building.address,
        building.longitude,
        building.latitude,
        building.metadata ? JSON.stringify(building.metadata) : null,
        building.expiresAt || null,
      ];
    }

    const result = await client.query(query, values);

    logger.debug('Saved building to database', {
      id: result.rows[0]?.id,
      source: building.source,
      name: building.name,
    });

    return result.rows[0]?.id as string;
  } catch (error) {
    logger.error('Error saving building to database', {
      error: error instanceof Error ? error.message : 'Unknown error',
      building,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Find cached buildings near a location using PostGIS
 * @param coordinates - Center point for search
 * @param radiusMeters - Search radius in meters
 * @returns Array of cached buildings within radius
 */
export async function findBuildingsNearLocation(
  coordinates: Coordinates,
  radiusMeters: number
): Promise<CachedBuilding[]> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT
        id,
        external_id,
        source,
        name,
        address,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        metadata,
        created_at,
        updated_at,
        expires_at
      FROM cached_buildings
      WHERE
        ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        )
    `;

    const values = [coordinates.longitude, coordinates.latitude, radiusMeters];

    const result = await client.query(query, values);

    const buildings: CachedBuilding[] = result.rows.map((row) => ({
      id: row.id,
      externalId: row.external_id,
      source: row.source,
      name: row.name,
      address: row.address,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
    }));

    logger.debug('Found cached buildings near location', {
      coordinates,
      radiusMeters,
      count: buildings.length,
    });

    return buildings;
  } catch (error) {
    logger.error('Error finding buildings near location', {
      error: error instanceof Error ? error.message : 'Unknown error',
      coordinates,
      radiusMeters,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a building by external ID and source
 * @param externalId - External API ID
 * @param source - Data source
 * @returns Cached building or null if not found
 */
export async function getBuildingByExternalId(
  externalId: string,
  source: string
): Promise<CachedBuilding | null> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT
        id,
        external_id,
        source,
        name,
        address,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        metadata,
        created_at,
        updated_at,
        expires_at
      FROM cached_buildings
      WHERE external_id = $1 AND source = $2
    `;

    const result = await client.query(query, [externalId, source]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      externalId: row.external_id,
      source: row.source,
      name: row.name,
      address: row.address,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
    };
  } catch (error) {
    logger.error('Error getting building by external ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      externalId,
      source,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete expired cache entries
 * Should be run periodically as a cleanup job
 * @returns Number of deleted entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  const client = await pool.connect();

  try {
    const query = `
      DELETE FROM cached_buildings
      WHERE expires_at IS NOT NULL AND expires_at < NOW()
    `;

    const result = await client.query(query);

    const deletedCount = result.rowCount || 0;

    logger.info('Cleaned up expired cache entries', { deletedCount });

    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get cache statistics
 * @returns Statistics about cached buildings
 */
export async function getCacheStats(): Promise<{
  totalBuildings: number;
  bySource: Record<string, number>;
  expiredCount: number;
}> {
  const client = await pool.connect();

  try {
    // Get total count
    const totalResult = await client.query('SELECT COUNT(*) as count FROM cached_buildings');
    const totalBuildings = parseInt(totalResult.rows[0]?.count || '0');

    // Get count by source
    const bySourceResult = await client.query(`
      SELECT source, COUNT(*) as count
      FROM cached_buildings
      GROUP BY source
    `);

    const bySource: Record<string, number> = {};
    bySourceResult.rows.forEach((row) => {
      bySource[row.source] = parseInt(row.count);
    });

    // Get expired count
    const expiredResult = await client.query(`
      SELECT COUNT(*) as count
      FROM cached_buildings
      WHERE expires_at IS NOT NULL AND expires_at < NOW()
    `);
    const expiredCount = parseInt(expiredResult.rows[0]?.count || '0');

    return {
      totalBuildings,
      bySource,
      expiredCount,
    };
  } catch (error) {
    logger.error('Error getting cache stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    client.release();
  }
}
