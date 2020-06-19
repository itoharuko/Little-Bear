const { v3d } = window;

/**
 * @description: 计算相机lookat点，相机位置，轨迹点数组
 * @param {
 *  fov: float                     //相机夹角
 *  aspect: float                  //scene宽高比
 *  center: v3d.Vector3,     //相机lookat目标物体点的坐标
 *  targetDot1: v3d.Vector3,       //目标物体刻字面上一个点的坐标
 *  targetDot2: v3d.Vector3,       //目标物体刻字面上一个点的坐标 （三个点组成一个平面，计算法向量）
 *  targetVolume: [l, w, h]        //目标物体立方体（长、宽、高）
 * }
 * @return: [camera vector, camera up vector]
 */
function calcCameraPosition(fov, aspect, up, originCenter, center, targetDot1, targetDot2, targetVolume, cameraStart, frame = 50) {

  function _calculate_nomal_vector() {  
    const vector1 = new v3d.Vector3();
    vector1.subVectors(targetDot1, center);
  
    const vector2 = new v3d.Vector3();
    vector2.subVectors(targetDot2, center);
  
    let normalVector = new v3d.Vector3();
    normalVector.crossVectors(vector1, vector2);
  
    const unitVector = normalVector.normalize();
    return unitVector;
  }

  function _calculate_orient_vector() {  
    const vector1 = new v3d.Vector3();
    vector1.subVectors(targetDot1, center);
  
    const orientVector = vector1.normalize();
    return orientVector;
  }

  function _calculate_distance() {
    const fov1 = fov * (Math.PI / 180);
    const maxLength = Math.sqrt(targetVolume[0] ** 2 + targetVolume[1] ** 2 + targetVolume[2] ** 2);
    const hor = 2 * Math.asin(aspect * Math.sin(fov1 / 2));
    const distanceFov = 0.5 * maxLength / Math.tan(fov1 / 2);
    const distanceHor = 0.5 * maxLength / Math.tan(hor / 2);
    return Math.max(distanceFov, distanceHor);
  }
  
  function calculate_cam_postion() {
    
    const normalVector = _calculate_nomal_vector();

    const distance = _calculate_distance();

    const centerAbsX = distance * normalVector.x + center.x;
    const centerAbsY = distance * normalVector.y + center.y;
    const centerAbsZ = distance * normalVector.z + center.z;

    const cameraEnd = new v3d.Vector3(centerAbsX, centerAbsY, centerAbsZ);

    const orientVector = _calculate_orient_vector();
    const list = calcCametaTrace(up, orientVector, originCenter, center, cameraStart, cameraEnd, frame);

    return list;
  }
  
  return calculate_cam_postion();
}

function calcCametaTrace(originUp, up, originCenter, targetCenter, cameraStart, cameraEnd, frame = 50) {
  const center = _three_dot_is_in_collinear();

  const line_vector = new v3d.Vector3();
  line_vector.subVectors(cameraEnd, cameraStart);
  const _start_end_length = Math.sqrt(line_vector.x ** 2 + line_vector.y ** 2 + line_vector.z ** 2);
  const _coefficient_1 = _start_end_length / frame;

  const start_center_vector = new v3d.Vector3();
  start_center_vector.subVectors(cameraStart, center);
  const _view_to_start_length = Math.sqrt(start_center_vector.x ** 2 + start_center_vector.y ** 2 + start_center_vector.z ** 2);

  const end_center_vector = new v3d.Vector3();
  end_center_vector.subVectors(cameraEnd, center);
  const _view_to_end_length = Math.sqrt(end_center_vector.x ** 2 + end_center_vector.y ** 2 + end_center_vector.z ** 2);

  const _coefficient_2 = (_view_to_end_length - _view_to_start_length) / frame;

  function _three_dot_is_in_collinear() {
    const line_vector = new v3d.Vector3();
    line_vector.subVectors(cameraEnd, cameraStart);
    const unit_vector = line_vector.normalize();

    let temp = new v3d.Vector3();
    temp.subVectors(targetCenter, cameraStart);
    temp = new v3d.Vector3(temp.x / unit_vector.x, temp.y / unit_vector.y, temp.z / unit_vector.z);
    if (temp.x === temp.y && temp.x === temp.z) {
      return targetCenter * 0.95;
    }
    return targetCenter;
  }

  function _cal_dot_from_start_to_end(i_th) {
    const line_vector = new v3d.Vector3();
    line_vector.subVectors(cameraEnd, cameraStart);
    const unit_vector = line_vector.normalize();
    const x = i_th * _coefficient_1 * unit_vector.x + cameraStart.x
    const y = i_th * _coefficient_1 * unit_vector.y + cameraStart.y
    const z = i_th * _coefficient_1 * unit_vector.z + cameraStart.z
    return new v3d.Vector3(x, y, z);
  }

  function _cal_camera_trace(i_th) {
    const middle_dot = _cal_dot_from_start_to_end(i_th)
    const line_vector = new v3d.Vector3();
    line_vector.subVectors(middle_dot, center);
    const unit_vector = line_vector.normalize();

    const x = (_view_to_start_length + i_th * _coefficient_2) * unit_vector.x + center.x
    const y = (_view_to_start_length + i_th * _coefficient_2) * unit_vector.y + center.y
    const z = (_view_to_start_length + i_th * _coefficient_2) * unit_vector.z + center.z

    return new v3d.Vector3(x, y, z);
  }

  function _calc_target_center(i_th) {
    const line_vector = new v3d.Vector3();
    line_vector.subVectors(targetCenter, originCenter);
    
    const target_vector = new v3d.Vector3();
    target_vector.addVectors(originCenter, new v3d.Vector3(line_vector.x / 50 * i_th, line_vector.y / 50 * i_th, line_vector.z / 50 * i_th));
    
    return target_vector;
  }

  function _calc_up(i_th) {
    const line_vector = new v3d.Vector3();
    line_vector.subVectors(up, originUp);
    
    const target_vector = new v3d.Vector3();
    target_vector.addVectors(originUp, new v3d.Vector3(line_vector.x / 50 * i_th, line_vector.y / 50 * i_th, line_vector.z / 50 * i_th));
    
    return target_vector;
  }

  function cal_camera_trace() {
    const list = [];
    for (let i = 0; i <= frame; i += 1) {
      list.push({ 
        center: _calc_target_center(i), 
        position: _cal_camera_trace(i),
        up: _calc_up(i),
      });
    }
    return list;
  }

  return cal_camera_trace();
}

window.calcCameraPosition = calcCameraPosition;
