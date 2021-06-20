const net = require('net');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { v4: uuidv4 } = require('uuid');
var async = require('async');

const contents = [
    'MAC', 'yyyyMMdd', 'HHmmssSSS',
    'latitude', 'longitude', 'altitude',
    'direction', 'speed', 'gps-state',
    'pothole-x', 'pothole-y', 'pothole-width', 'pothole-height',
    'filename', 'address',
    'ori-filename', 'area',
    'g-sensor-data-length', 'g-sensor-data',
    'device-type', 'software-version'
];

const drop_type = [
    'MAC', 'yyyyMMdd', 'HHmmssSSS',
    'latitude', 'longitude', 'altitude',
    'direction', 'speed', 'gps-state',
    'address', 'device-type', 'software-version'
]

const devicename = [
    'DEVICE00000000157', 'DEVICE00000000158', 'DEVICE00000000159', 'DEVICE00000000160', 'DEVICE00000000161', 'DEVICE00000000162','DEVICE00000000163','DEVICE00000000164','DEVICE00000000165',
'DEVICE00000000166','DEVICE00000000167','DEVICE00000000168','DEVICE00000000169','DEVICE00000000170','DEVICE00000000171','DEVICE00000000172','DEVICE00000000173','DEVICE00000000174',
'DEVICE00000000175','DEVICE00000000176','DEVICE00000000177','DEVICE00000000178','DEVICE00000000179','DEVICE00000000180','DEVICE00000000181','DEVICE00000000182','DEVICE00000000183',
'DEVICE00000000184','DEVICE00000000185','DEVICE00000000186','DEVICE00000000187','DEVICE00000000188','DEVICE00000000189','DEVICE00000000190','DEVICE00000000191','DEVICE00000000192'
]
const DELIMITER = '\r\n';
//const DIR_PREFIX = path.join(path.dirname(require.main.filename), '/uploads');
const ALLOWED_IMAGE_EXT = ['.', 'jpg', 'png'].join(' .');
const ALLOWED_META_EXT = ['.', 'txt'].join(' .');


const dirtest = '/upload';
var txtfile = 'test.txt';
var dirName = path.dirname(txtfile);
var baseName = path.basename(txtfile);
var extName = path.extname(txtfile);


fs.readdir(dirtest, (err, files) => 
{ //t1folder, t2folder
    console.log("진입1", files);
    
    for (let i = 0; i < files.length; i++) 
    {
        var dirtest2 = path.join(dirtest, files[i]);
        console.log("dirtest2", dirtest2);


        fs.readdir(dirtest2, (err, files2) => 
        { //t1folder-> test0, test1, test2  // t2folder -> X
            console.log(files2);
            for (let j = 0; j < files2.length; j++) 
            {
                var dirtest3 = path.join(dirtest, files[i], files2[j]);
                console.log("dirtest2", files[i], "dirtest3", dirtest3);
                if (ALLOWED_META_EXT.includes(path.extname(txtfile))) 
                {
                    // var txtfile2 = path.join(dirtest+dirtest2)+"/test"+i+".txt";
                    // console.log("txtfile2",txtfile2);

                    fs.readFile(dirtest3, 'utf8', function (err, data) 
                    {
                        parse_meta_data(data, async (json) => 
                        {
                            const options = { autoCommit: true }
                            for (let i = 0; i < json.item.length; ++i) 
                            {
                                let item = json.item[i];
                                let meta_rect =
                                {
                                    'pothole-x': item['pothole-x'],
                                    'pothole-y': item['pothole-y'],
                                    'pothole-width': item['pothole-width'],
                                    'pothole-height': item['pothole-height'],
                                }

                                // insert meta to database
                                // const insertion_query = `
                                // MERGE INTO ORIGIN_IMAGES d
                                // USING (SELECT :file_path file_path, :meta_data meta, :meta_rect rect
                                //        from dual) s
                                // ON (d.FILE_PATH = s.file_path)
                                // WHEN MATCHED THEN
                                //     UPDATE
                                //     SET d.META_RECT_LIST =
                                //             UTL_RAW.CAST_TO_RAW(CONCAT(UTL_RAW.CAST_TO_VARCHAR2(d.META_RECT_LIST), CONCAT('#', s.rect)))
                                // WHEN NOT MATCHED THEN
                                //     INSERT (ID, FILE_PATH, META_DATA, META_RECT_LIST)
                                //     VALUES (ORIGIN_IMAGES_ID_SEQ.nextval, s.file_path, UTL_RAW.CAST_TO_RAW(s.meta), UTL_RAW.CAST_TO_RAW(s.rect))`

                                // const result = await database.simpleExecute(insertion_query, {
                                //     file_path: item.filename,
                                //     meta_data: JSON.stringify(item),
                                //     meta_rect: JSON.stringify(meta_rect),
                                // }, options)
                            }
                        });
                    });

                }
            }
        });
    }
});







function parse_meta_data(data, cb) 
{
    let pothole_meta_list = data.toString().replace(/(\r\n|\n|\r|\t)/gm, '')
        .replace(/\\/gm, '/').split('#')
    console.log("테스트", pothole_meta_list)
    let json = { item: [] }
    let filenames = []
    while (pothole_meta_list.length !== 0) 
    {
        let item = {}
        let is_drop_type = false
        for (let i in contents) 
        {
            let shift = pothole_meta_list.shift()
            item[contents[i]] = shift && shift.includes('->') ? shift.split('->')[1] : shift // temp
            if (item[contents[i]] === undefined || item[contents[i]] === '') 
            {
                is_drop_type = true
            }
        }
        item['g-sensor-data'] = item['g-sensor-data'] && item['g-sensor-data'].split(',')
        if (!filenames.includes(item.filename) && item['MAC'] !== '') 
        {
            if (!is_drop_type) 
            {
                json['item'].push(item);
            }
        }
        // for debug
        if (item['filename']) 
        {
            filenames.push(item['filename'])
        }
    }
    cb(json);
}
