const express = require('express');
const Zone = require('../../../models/Zone');
const { RangeQuery } = require('../../../tools');
const retrieveError = require('../../../tools/retrieveError');

const router = express.Router();

/**
 * Get Zone list
 * Access at GET https://localhost:8080/api/en/zones
 * @param {string} [name] - Get by name.
 * @param {string} [sort] - Sort fields (ex. "+name").
 * @param {string} [fields] - Fields selected (ex. "name").
 * @param {number} [limit] - Number of limit per query.
 * @param {number} [skip=0] - Offset documents.
 *
 * @return {boolean} success - Successful querying flag.
 * @return {zones[]} results - Result zones from the query.
 * @return {Object} queryInfo - Metadata query information.
 * @return {number} queryInfo.total - Total numbers of documents in collection that match the query.
 * @return {number} queryInfo.limit - Limit that was used.
 * @return {number} queryInfo.skip - Skip that was used.
 */
router.get('/', (req, res) => {
//----------------------------------------------------------------
  // initial the fieldwant from request
  let fieldwant = '';
  if (req.query.fields) {
    req.query.fields.split(',').forEach(
      (element) => {
        if (element === 'nameEN') {
          element = 'name.en';
        } else if (element === 'welcomeMessageEN') {
          element = 'welcomeMessage.en';
        } else if (element === 'shortNameEN') {
          element = 'shortName.en';
        } else if (element === 'descriptionEN') {
          element = 'description.en';
        } else if (element === 'shortNameEN') {
          element = 'shortName.en';
        } else if (element === 'descriptionEN') {
          element = 'description.en';
        } else if (element === 'locationLat') {
          element = 'location.latitude';
        } else if (element === 'locationLong') {
          element = 'location.longitude';
        }
        fieldwant = `${fieldwant}${element} `;
      }
    );
  }
//----------------------------------------------------------------
// initial filter : name query
  const filter = {};

  if (req.query.nameEN) {
    filter['name.en'] = { $regex: req.query.nameEN };
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }


  // Zones's updateAt range query
  if (req.query.update) {
    try {
      req.query.update = JSON.parse(req.query.update);
    } catch (err) {
      // return res.sendError(5, err);
    }
    filter.updateAt = RangeQuery(req.query.update, 'Date');
  }

//----------------------------------------------------------------
// initial limit
  let limit;
  if (req.query.limit) {
    limit = Number.parseInt(req.query.limit, 10);
  }
  // initital skip
  let skip;
  if (req.query.skip) {
    skip = Number.parseInt(req.query.skip, 10);
  }
  //----------------------------------------------------------------
  // initial sort : sort query
  let sort = {};
  if (req.query.sort) {
    sort = req.query.sort.split(',').reduce((prev, sortQuery) => {
      let sortFields = sortQuery[0] === '-' ? sortQuery.substr(1) : sortQuery;
      if (sortFields === 'nameEN') sortFields = 'name.en';
      if (sortQuery[0] === '-') {
        prev[sortFields] = -1;
      } else {
        prev[sortFields] = 1;
      }
      return prev;
    }, {});
  }

  //----------------------------------------------------------------
  Zone.find(filter).count((err, total) => {
    if (err) {
      return res.sendError(5, err);
    }
    Zone.find(filter)
      .select(fieldwant).sort(sort).skip(skip)
      .limit(limit)
      .exec((err, zones) => {
        if (err) {
          return res.sendError(5, err);
        }

        return res.status(200).json({
          success: true,
          results: zones,
          queryInfo: {
            total,
            limit,
            skip,
          }
        });
      });
  });
});
 //----------------------------------------------------------------
 //----------------------------------------------------------------
 /**
  * Get Zones by Id
  */
router.get('/:id', (req, res) => {
  //----------------------------------------------------------------
    // initial the fieldwant from request
  let fieldwant = '';
  if (req.query.fields) {
    req.query.fields.split(',').forEach(
        (element) => {
          if (element === 'nameEN') {
            element = 'name.en';
          }
          if (element === 'welcomeMessageEN') {
            element = 'welcomeMessage.en';
          }
          if (element === 'shortNameEN') {
            element = 'shortName.en';
          }
          if (element === 'descriptionEN') {
            element = 'description.en';
          }
          if (element === 'locationLat') {
            element = 'location.latitude';
          }
          if (element === 'locationLong') {
            element = 'location.longitude';
          }
          fieldwant = `${fieldwant}${element} `;
        }
      );
  }

  Zone.findById(req.params.id).select(fieldwant).exec((err, zone) => {
    if (err) {
      // Handle error from User.findById
      return res.status(500).json({
        success: false,
        errors: retrieveError(5, err)
      });
    }

    if (!zone) {
      return res.status(403).json({
        success: false,
        results: retrieveError(34)
      });
    }

    return res.status(200).json({
      success: true,
      results: zone
    });
  });
});

/**
* Create a new Zone
* Access at POST http://localhost:8080/api/en/zones
*/
router.post('/', (req, res) => {
 // Create object

  const zone = new Zone();

 // Set field value (comes from the request)
  zone.name.en = req.body.nameEN;
  zone.name.th = req.body.nameTH;
  zone.places = req.body.places;
  if (req.body.thumbnail) {
    zone.thumbnail = req.body.thumbnail;
  }
  if (req.body.banner) {
    zone.banner = req.body.banner;
  }
  zone.welcomeMessage.en = req.body.welcomeMessageEN;
  zone.welcomeMessage.th = req.body.welcomeMessageTH;
  zone.shortName.en = req.body.shortNameEN;
  zone.shortName.th = req.body.shortNameTH;
  zone.description.en = req.body.descriptionEN;
  zone.description.th = req.body.descriptionTH;
  if (req.body.website) {
    zone.website = req.body.website;
  }
  zone.type = req.body.type;
  zone.location.latitude = req.body.locationLat;
  zone.location.longitude = req.body.locationLong;

 // Save zone and check for error
  zone.save((err, _zone) => {
    if (err) {
     // Handle error from save
      return res.status(500).json({
        success: false,
        errors: retrieveError(5, err),
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Create Zone successful',
      results: _zone
    });
  });
});

// Update an existing zone via PUT(JSON format)
// ex. { "name","EditName"}
// Access at PUT http://localhost:3000/api/en/zones/:id
router.put('/:id', (req, res) => {
  Zone.findById(req.params.id, (err, zone) => {
  // check error first

    if (err) {
      return res.status(500).json({
        success: false,
        errors: retrieveError(5, err)
      });
    }
  // check zone
    if (!zone) {
      return res.status(403).json({
        success: false,
        errors: retrieveError(26)
      });
    }

    if (req.body.nameEN) {
      zone.name.en = req.body.nameEN;
    }
    if (req.body.nameTH) {
      zone.name.th = req.body.nameTH;
    }
    if (req.body.places) {
      zone.places = req.body.places;
    }
    if (req.body.thumbnail) {
      zone.thumbnail = req.body.thumbnail;
    }
    if (req.body.banner) {
      zone.banner = req.body.banner;
    }
    if (req.body.welcomeMessageTH) {
      zone.welcomeMessage.th = req.body.welcomeMessageTH;
    }
    if (req.body.welcomeMessageEN) {
      zone.welcomeMessage.en = req.body.welcomeMessageEN;
    }
    if (req.body.shortNameTH) {
      zone.shortName.th = req.body.shortNameTH;
    }
    if (req.body.shortNameEN) {
      zone.shortName.en = req.body.shortNameEN;
    }
    if (req.body.descriptionTH) {
      zone.description.th = req.body.descriptionTH;
    }
    if (req.body.descriptionEN) {
      zone.description.en = req.body.descriptionEN;
    }
    if (req.body.website) {
      zone.website = req.body.website;
    }
    if (req.body.type) {
      zone.type = req.body.type;
    }
    if (req.body.locationLat) {
      zone.location.latitude = req.body.locationLat;
    }
    if (req.body.locationLong) {
      zone.location.longitude = req.body.locationLong;
    }

    zone.updateAt = new Date();

    zone.save((err, _zone) => {
      if (err) {
        return res.status(500).json({
          success: false,
          errors: retrieveError(5, err)
        });
      }
      return res.status(202).json({
        success: true,
        message: 'Update zone successful',
        results: _zone
      });
    });
  });
});

// Delete an existing zone via DEL.
// Access at DEL http://localhost:3000/api/en/zones/:id
router.delete('/:id', (req, res) => {
  Zone.findByIdAndRemove(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        errors: retrieveError(5, err)
      });
    }
    return res.status(202).json({
      success: true,
      message: `An Zone with id ${req.params.id} was removed.`,
    });
  });
});

module.exports = router;
