# About
This is file uploader developed specially for CIET MIPT projects. You can use it at your own risk!

# Table structure
## vu_file
* guid - Unique identificator for the file. Also works as filename. Generates randomly.
* path - Path to the file relative to the base datapath directory.
* extension
* name - Original filename.
* status - File status: new, uploading, error, deleted, ok.
* message - Message regarding status. Useful for errors.
* dt - Last file edit dt.
* userID - If you want to relate some user table for this file, use this field.

## vu_log
* fileGuid - Relation to file guid.
* status - Last status changed.
* message
* dt - Datetime when status was changed.
* userID - User by which status was changed.

# Config

**basepath** - Base path to store files. Must be writable. 
**chunksize** - File chunk size in bytes to upload large files. Default is 1048576 (1M).
**extensions** - Allowed extensions to load. If _null_ then any extension is allowed.
**maxsize** - Maximum file size to upload. Default is _null_ (unlimited). If this value more than _upload_max_filesize_ or _post_max_size_, then minimum of these values will be used.