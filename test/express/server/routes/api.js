import express from 'express';
import _ from 'lodash';
import {ODataModelBuilder} from "@themost/data/odata";
const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    /**
     * @type {ODataConventionModelBuilder|*}
     */
    const builder = req.context.getStrategy(ODataModelBuilder);
    return builder.getEdm().then((result) => {
      res.set('Cache', 'no-cache');
      res.set('OData-Version', '4.0');
      res.set('Content-Type', 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8');
      res.send({
        "@odata.context":`${req.baseUrl}/$metadata`,
        "value":result.entityContainer.entitySet
      });
    }).catch((err)=> {
      return next(err);
    });

  }
  catch(err) {
    return next(err);
  }
});

router.get('/\\$metadata', (req, res, next) => {
  try {
    /**
     * @type {ODataConventionModelBuilder|*}
     */
    const builder = req.context.getConfiguration().getStrategy(ODataModelBuilder);
    return builder.getEdmDocument().then((result) => {
      res.set('OData-Version', '4.0');
      res.set('Content-Type', 'application/xml;charset=utf-8');
      res.send(result.outerXML());
    }).catch((err)=> {
      return next(err);
    });
  }
  catch(err) {
    return next(err);
  }
});

/* GET model data. */
router.get('/:model', (req, res, next) => {


  /**
   * @type {ODataModelBuilder|*}
   */
  const builder = req.context.getConfiguration().getStrategy(ODataModelBuilder);
  builder.getEdm().then(()=>{
    const entitySet = builder.getEntitySet(req.params.model);
    if (_.isNil(entitySet)) {
      return next();
    }
    const model = req.context.model(entitySet.entityType.name);
    if (_.isNil(model)) {
      return next();
    }
    model.filter(req.query,(err, q)=>{
      if (err) {
        return next(err);
      }
      if (/true/i.test(req.query.$count)) {
        return q.getList().then((result)=> {
          res.set('Cache', 'no-cache');
          res.set('OData-Version', '4.0');
          res.set('Content-Type', 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8');
          res.send({
            "@odata.context": "/api/$metadata#" + entitySet.name,
            "@odata.count": result.total,
            "value": result.records
          });
        }).catch((err)=> {
          next(err);
        });
      }
      return q.getItems().then((result)=> {
        res.set('Cache', 'no-cache');
        res.set('OData-Version', '4.0');
        res.set('Content-Type', 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8');
        res.send({
          "@odata.context": "/api/$metadata#" + entitySet.name,
          "value": result
        });
      }).catch((err)=> {
        next(err);
      });
    });
  }).catch((err)=> {
    next(err);
  });
});

export default router;
