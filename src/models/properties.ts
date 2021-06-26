import * as React from "react";
import firebase from "firebase/app";

import { FieldProps } from "./fields";
import { PreviewComponentProps } from "../preview";
import { ChipColor } from "./colors";
import { EntitySchema, EntityValues } from "./models";

export type CMSType = string
    | number
    | boolean
    | Date
    | firebase.firestore.Timestamp
    | firebase.firestore.GeoPoint
    | firebase.firestore.DocumentReference
    | CMSType[]
    | object;

export type Property<T extends CMSType = any> =
    T extends string ? StringProperty :
        T extends number ? NumberProperty :
            T extends boolean ? BooleanProperty :
                T extends Date ? TimestampProperty :
                    T extends firebase.firestore.Timestamp ? TimestampProperty :
                        T extends firebase.firestore.GeoPoint ? GeopointProperty :
                            T extends firebase.firestore.DocumentReference ? ReferenceProperty :
                                T extends Array<any> ? ArrayProperty<T> :
                                    T extends object ? MapProperty<T> : never;


export type DataType =
    | "number"
    | "string"
    | "boolean"
    | "map"
    | "array"
    | "timestamp"
    | "geopoint"
    | "reference";

export type MediaType =
    | "image"
    | "video"
    | "audio";

/**
 * Interface including all common properties of a CMS property
 */
interface BaseProperty {

    /**
     * Firestore datatype of the property
     */
    dataType: DataType;

    /**
     * Property title (e.g. Product)
     */
    title?: string;

    /**
     * Property description, always displayed under the field
     */
    description?: string;

    /**
     * Longer description of a field, displayed under a popover
     */
    longDescription?: string;

    /**
     * Width in pixels of this column in the collection view. If not set
     * the width is inferred based on the other configurations
     */
    columnWidth?: number;

    /**
     * Is this a read only property. When set to true, it gets rendered as a
     * preview.
     */
    readOnly?: boolean;

    /**
     * Is this field disabled. When set to true, it gets rendered as a
     * disabled field. You can also specify a configuration for defining the
     * behaviour of disabled properties
     */
    disabled?: boolean | PropertyDisabledConfig;

    /**
     * Rules for validating this property
     */
    validation?: PropertyValidationSchema;

}

export type PropertyDisabledConfig = {

    /**
     * Enable this flag if you would like to clear the value of the field
     * when the corresponding property gets disabled.
     *
     * This is useful for keeping data consistency when you have conditional
     * properties.
     */
    clearOnDisabled?: boolean;

    /**
     * Explanation of why this property is disabled (e.g. a different field
     * needs to be enabled)
     */
    disabledMessage?: string;
}

export type EnumType = number | string;

/**
 * We use this type to define mapping between string or number values in
 * Firestore to a label (such in a select dropdown).
 * The key in this Record is the value saved in Firestore, and the value in
 * this record is the label displayed in the UI.
 * You can add additional customization by assigning a `EnumValueConfig` for the
 * label instead of a simple string (for enabling or disabling options and
 * choosing colors).
 * If you need to ensure the order of the elements you can pass a `Map` instead
 * of a plain object.
 */
export type EnumValues =
    Record<string | number, string | EnumValueConfig>
    | Map<string, string | EnumValueConfig>;

/**
 * Configuration for a particular entry in an `EnumValues`
 */
export type EnumValueConfig = {
    label: string;
    disabled?: boolean;
    color?: ChipColor;
}

/**
 * Record of properties of an entity or a map property
 */
export type Properties<Key extends string = string> = Record<Key, Property>;

export type PropertyBuilderProps<S extends EntitySchema<Key> = EntitySchema<any>, Key extends string = Extract<keyof S["properties"], string>> =
    {
        values: Partial<EntityValues<S, Key>>;
        entityId?: string;
    };

export type PropertyBuilder<T extends CMSType = CMSType, S extends EntitySchema<Key> = EntitySchema<any>, Key extends string = Extract<keyof S["properties"], string>> = (props: PropertyBuilderProps<S, Key>) => Property<T>;
export type PropertyOrBuilder<T extends CMSType = CMSType, S extends EntitySchema<Key> = EntitySchema<any>, Key extends string = Extract<keyof S["properties"], string>> =
    Property<T>
    | PropertyBuilder<T, S, Key>;

export type PropertiesOrBuilder<S extends EntitySchema<Key>,
    Key extends string = Extract<keyof S["properties"], string>> = Record<Key, PropertyOrBuilder<CMSType, S, Key>>;


export interface NumberProperty extends BaseProperty {

    dataType: "number";

    /**
     * Configure how this field is displayed
     */
    config?: NumberFieldConfig;

    /**
     * Rules for validating this property
     */
    validation?: NumberPropertyValidationSchema,

}

export interface BooleanProperty extends BaseProperty {

    dataType: "boolean";

    /**
     * Rules for validating this property
     */
    validation?: PropertyValidationSchema,

    /**
     * Configure how this property field is displayed
     */
    config?: FieldConfig<boolean>;
}

export interface StringProperty extends BaseProperty {

    dataType: "string";

    /**
     * Configure how this field is displayed
     */
    config?: StringFieldConfig;

    /**
     * Rules for validating this property
     */
    validation?: StringPropertyValidationSchema,
}

export interface ArrayProperty<T extends ArrayT[] = any[], ArrayT extends CMSType = CMSType> extends BaseProperty {

    dataType: "array";

    /**
     * The property of this array. You can specify any property.
     * You can leave this field empty only if you are providing a custom field
     */
    of?: Property<ArrayT>;

    /**
     * Rules for validating this property
     */
    validation?: ArrayPropertyValidationSchema,

    /**
     * Configure how this property field is displayed
     */
    config?: FieldConfig<T>;
}

export interface MapProperty<T extends object = {},
    Key extends string = string> extends BaseProperty {

    dataType: "map";

    /**
     * Record of properties included in this map.
     */
    properties?: Properties<string>;

    /**
     * Rules for validating this property
     */
    validation?: PropertyValidationSchema,

    /**
     * Properties that are displayed when as a preview
     */
    previewProperties?: Key[];

    /**
     * Configure how this property field is displayed
     */
    config?: MapFieldConfig<T>;
}

export interface TimestampProperty extends BaseProperty {
    dataType: "timestamp";

    /**
     * Rules for validating this property
     */
    validation?: TimestampPropertyValidationSchema;

    /**
     * If this flag is  set to `on_create` or `on_update` this timestamp is
     * updated automatically on creation of the entity only or on every
     * update (including creation). Useful for creating `created_on` or
     * `updated_on` fields
     */
    autoValue?: "on_create" | "on_update"

    /**
     * Configure how this property field is displayed
     */
    config?: FieldConfig<Date>;
}

// TODO: currently this is the only unsupported field
export interface GeopointProperty extends BaseProperty {
    dataType: "geopoint";

    /**
     * Rules for validating this property
     */
    validation?: PropertyValidationSchema,

    /**
     * Configure how this property field is displayed
     */
    config?: FieldConfig<firebase.firestore.GeoPoint>;
}

export interface ReferenceProperty<S extends EntitySchema<Key> = EntitySchema<any>,
    Key extends string = Extract<keyof S["properties"], string>>
    extends BaseProperty {

    dataType: "reference";

    /**
     * Absolute collection path of the collection this reference points to.
     * The schema of the entity is inferred based on the root navigation, so
     * the filters and search delegate existing there are applied to this view
     * as well.
     */
    collectionPath: string;

    /**
     * Properties that need to be rendered when displaying a preview of this
     * reference. If not specified the first 3 are used. Only the first 3
     * specified values are considered.
     */
    previewProperties?: Key[];

    /**
     * Configure how this property field is displayed
     */
    config?: FieldConfig<firebase.firestore.DocumentReference>;
}


/**
 * Rules to validate any property. Some properties have specific rules
 * on top of these.
 */
export interface PropertyValidationSchema {
    /**
     * Is this field required
     */
    required?: boolean;

    /**
     * Customize the required message when the property is not set
     */
    requiredMessage?: string;

    /**
     * If the unique flag is set to `true`, you can only have one entity in the
     * collection with this value.
     */
    unique?: boolean;

    /**
     * If the uniqueInArray flag is set to `true`, you can only have this value
     * once per entry in the parent `ArrayProperty`. It has no effect if this
     * property is not a child of an `ArrayProperty`. It works on direct
     * children of an `ArrayProperty` or first level children of `MapProperty`
     */
    uniqueInArray?: boolean;
}

/**
 * Validation rules for numbers
 */
export interface NumberPropertyValidationSchema extends PropertyValidationSchema {
    min?: number;
    max?: number;
    lessThan?: number;
    moreThan?: number;
    positive?: boolean;
    negative?: boolean;
    integer?: boolean;
}

/**
 * Validation rules for strings
 */
export interface StringPropertyValidationSchema extends PropertyValidationSchema {
    length?: number;
    min?: number;
    max?: number;
    matches?: RegExp;
    email?: boolean;
    url?: boolean;
    trim?: boolean;
    lowercase?: boolean;
    uppercase?: boolean;
}

/**
 * Validation rules for dates
 */
export interface TimestampPropertyValidationSchema extends PropertyValidationSchema {
    min?: Date;
    max?: Date;
}

/**
 * Validation rules for arrays
 */
export interface ArrayPropertyValidationSchema extends PropertyValidationSchema {
    min?: number;
    max?: number;
}

/**
 * Configure how a field is displayed
 */
export interface FieldConfig<T extends CMSType, CustomProps = any> {

    /**
     * If you need to render a custom field, you can create a component that
     * takes `FieldProps` as props. You receive the value, a function to
     * update the value and additional utility props such as if there is an error.
     * You can customize it by passing custom props that are received
     * in the component.
     */
    field?: React.ElementType<FieldProps<T, CustomProps>>;

    /**
     * Configure how a property is displayed as a preview, e.g. in the collection
     * view. You can customize it by passing custom props that are received
     * in the component.
     */
    preview?: React.ElementType<PreviewComponentProps<T, CustomProps>>;

    /**
     * Additional props that are passed to the components defined in `field`
     * or in `preview`.
     */
    customProps?: CustomProps;
}

/**
 * Possible configuration fields for a string property. Note that setting one
 * config disables the others.
 */
export interface StringFieldConfig extends FieldConfig<string> {

    /**
     * Is this string property long enough so it should be displayed in
     * a multiple line field. Defaults to false. If set to true,
     * the number of lines adapts to the content
     */
    multiline?: boolean;

    /**
     * Should this string property be displayed as a markdown field. If true,
     * the field is rendered as a text editors that supports markdown highlight
     * syntax. It also includes a preview of the result.
     */
    markdown?: boolean;

    /**
     * You can use the enum values providing a map of possible
     * exclusive values the property can take, mapped to the label that it is
     * displayed in the dropdown. You can use a simple object with the format
     * `value` => `label`, or with the format `value` => `EnumValueConfig` if you
     * need extra customization, (like disabling specific options or assigning
     * colors). If you need to ensure the order of the elements, you can pass
     * a `Map` instead of a plain object.
     */
    enumValues?: EnumValues;

    /**
     * You can specify a `StorageMeta` configuration. It is used to
     * indicate that this string refers to a path in Google Cloud Storage.
     */
    storageMeta?: StorageMeta;

    /**
     * If the value of this property is a URL, you can set this flag to true
     * to add a link, or one of the supported media types to render a preview
     */
    url?: boolean | MediaType;

    /**
     * Should this string be rendered as a tag instead of just text.
     */
    previewAsTag?: boolean;

}

/**
 * Additional configuration related to Storage related fields
 */
export interface StorageMeta {

    /**
     * Media type of this reference, used for displaying the preview
     */
    mediaType?: MediaType;

    /**
     * Absolute path in your bucket. You can specify it directly or use a callback
     */
    storagePath: string | ((context: UploadedFileContext) => string);

    /**
     * File MIME types that can be uploaded to this reference
     */
    acceptedFiles?: StorageFileTypes[];

    /**
     * Specific metadata set in your uploaded file
     */
    metadata?: firebase.storage.UploadMetadata,

    /**
     * You can use this callback to customize the uploaded filename
     * @param context
     */
    fileName?: (context: UploadedFileContext) => string;

    /**
     * When set to true, this flag indicates that the download URL of the file
     * will be saved in Firestore instead of the Cloud storage path.
     * Note that the generated URL may use a token that, if disabled, may
     * make the URL unusable and lose the original reference to Cloud Storage,
     * so it is not encouraged to use this flag. Defaults to false
     */
    storeUrl?: boolean,

}

export type UploadedFileContext = {
    /**
     * Uploaded file
     */
    file: File;

    /**
     * Property field name
     */
    name: string;

    /**
     * Property related to this upload
     */
    property: Property;

    /**
     * Entity Id is set if the entity already exists
     */
    entityId?: string;

    /**
     * Values of the current entity
     */
    entityValues: EntityValues<any>;

    /**
     * Storage meta specified by the developer
     */
    storageMeta: StorageMeta;
}

/**
 * Possible configuration fields for a string property. Note that setting one
 * config disables the others.
 */
export interface MapFieldConfig<T extends {}> extends FieldConfig<T> {

    /**
     * Allow the user to add only some of the keys in this map.
     * By default all properties of the map have the corresponding field in
     * the form view. Setting this flag to true allows to pick only some.
     * Useful for map that can have a lot of subproperties that may not be
     * needed
     */
    pickOnlySomeKeys?: boolean;

    /**
     * Set this flag to true if you would like to remove values that are not
     * present in the saved value but are mapped in the schema.
     * This is useful if you are creating a custom field and need to have only
     * some specific properties. If set to false, when saving a new map value,
     * fields that exist in Firestore but not in the new value are not deleted.
     * Defaults to false.
     */
    clearMissingValues?: boolean;

}

/**
 * MIME types for storage fields
 */
export type StorageFileTypes =
    "image/*"
    | "video/*"
    | "audio/*"
    | "application/*"
    | "text/*"
    | "font/*"
    | string; // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types

export interface NumberFieldConfig extends FieldConfig<number> {

    /**
     * You can use the enum values providing a map of possible
     * exclusive values the property can take, mapped to the label that it is
     * displayed in the dropdown.
     */
    enumValues?: EnumValues;

}