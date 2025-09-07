---
id: delete-steering
name: Delete Steering
version: 1.0.0
description: Prompt for updating project documentation after deleting a steering document
variables:
  documentName:
    type: string
    required: true
    description: Name of the deleted steering document
  steeringPath:
    type: string
    required: true
    description: Path where steering documents are stored
---

The steering document "{{documentName}}" has been deleted from {{steeringPath}}.

If a project documentation file exists and contains a "## Steering Documents" section, please update it to remove the reference to this deleted document.
