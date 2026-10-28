/* The export surface of `three.slim.module.js`: what the handset itself uses, plus every symbol
   GLTFLoader and DRACOLoader import. Adding a name here and rebuilding is the whole procedure;
   the header of three.slim.module.js holds the two commands. */
export {
  /* — the handset — */
  Scene, PerspectiveCamera, WebGLRenderer, PMREMGenerator, Group, Mesh,
  BufferGeometry, BufferAttribute, PlaneGeometry, BoxGeometry, CylinderGeometry, TorusGeometry,
  MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial,
  DirectionalLight, HemisphereLight, PointLight, Vector2, Vector3, Matrix4, Quaternion, Euler, Color, MathUtils,
  ACESFilmicToneMapping, SRGBColorSpace, DoubleSide, BackSide,
  /* — the real model: Box3/Sphere measure it, Object3D/Texture come with it — */
  Box3, Sphere, Object3D, Texture, EquirectangularReflectionMapping,
  /* — GLTFLoader / DRACOLoader — */
  AnimationClip, Bone, ClampToEdgeWrapping, ColorManagement, FileLoader, FrontSide,
  ImageBitmapLoader, InstancedMesh, InterleavedBuffer, InterleavedBufferAttribute, Interpolant,
  InterpolateDiscrete, InterpolateLinear, Line, LineBasicMaterial, LineLoop, LineSegments,
  LinearFilter, LinearMipmapLinearFilter, LinearMipmapNearestFilter, LinearSRGBColorSpace,
  Loader, LoaderUtils, Material, MirroredRepeatWrapping, NearestFilter,
  NearestMipmapLinearFilter, NearestMipmapNearestFilter, NumberKeyframeTrack,
  OrthographicCamera, Points, PointsMaterial, PropertyBinding, QuaternionKeyframeTrack,
  RepeatWrapping, Skeleton, SkinnedMesh, SpotLight, TextureLoader, TriangleFanDrawMode,
  TriangleStripDrawMode, TrianglesDrawMode, VectorKeyframeTrack, InstancedBufferAttribute,
  Float32BufferAttribute
} from 'three';   // three@0.169.0, from `npm pack three@0.169.0`
