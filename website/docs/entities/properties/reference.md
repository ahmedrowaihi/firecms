---
id: reference
title: Reference
sidebar_label: Reference
---
## `path`

Absolute collection path of the collection this reference
  points to. The schema of the entity is inferred based on the root navigation,
  so the filters and search delegate existing there are applied to this view as
  well.

## `previewProperties`
List of properties rendered as this reference preview.
  Defaults to first 3.

## `validation`

* `required` Should this field be compulsory.
* `requiredMessage` Message to be displayed as a validation error.


---

The widget that gets created is
- [`ReferenceField`](api/functions/referencefield.md) Field that opens a
reference selection dialog

Links:
- [API](api/interfaces/referenceproperty.md)