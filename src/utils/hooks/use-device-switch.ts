import { AgoraRteMediaPublishState } from 'agora-rte-sdk';
import { EduStreamUI } from '../stream/struct';
import { useStore } from './use-store';
import { SvgIconEnum } from '@components/svg-img';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import {
  CustomMessageCommandType,
  CustomMessageDeviceState,
  CustomMessageDeviceType,
} from '@onlineclass/uistores/type';
const colors = themeVal('colors');
export const checkCameraEnabled = (stream?: EduStreamUI) => {
  return stream?.isVideoDeviceEnabled && stream.isVideoStreamPublished;
};
export const checkMicEnabled = (stream?: EduStreamUI) => {
  return stream?.isMicDeviceEnabled && stream.isMicStreamPublished;
};
export const useDeviceSwitch = ({
  stream,
  isLocal,
}: {
  stream?: EduStreamUI;
  isLocal: boolean;
}) => {
  const {
    layoutUIStore: { addDialog },
    deviceSettingUIStore: {
      isCameraDeviceEnabled,
      isAudioRecordingDeviceEnabled,
      enableCamera,
      enableAudioRecording,
    },
    classroomStore: {
      streamStore: { updateRemotePublishState },
      roomStore: { sendCustomPeerMessage },
    },
  } = useStore();

  const micEnabled = isLocal ? isAudioRecordingDeviceEnabled : checkMicEnabled(stream);

  const cameraEnabled = isLocal ? isCameraDeviceEnabled : checkCameraEnabled(stream);
  const toggleLocalCameraDevice = async () => {
    if (isCameraDeviceEnabled) {
      enableCamera(false);
    } else {
      if (stream?.isVideoStreamPublished) {
        enableCamera(true);
      } else {
        addDialog('confirm', {
          title: 'Notice',
          content: 'You can raise hand to request the teacher to start video.',
          cancelButtonVisible: false,
          okButtonProps: {
            styleType: 'danger',
          },
        });
      }
    }
  };
  const toggleLocalAudioRecordingDevice = async () => {
    if (isAudioRecordingDeviceEnabled) {
      enableAudioRecording(false);
    } else {
      if (stream?.isMicStreamPublished) {
        enableAudioRecording(true);
      } else {
        addDialog('confirm', {
          title: 'Notice',
          content: 'You can raise hand to request the teacher to unmute.',
          cancelButtonVisible: false,
          okButtonProps: {
            styleType: 'danger',
          },
        });
      }
    }
  };
  const localCameraTooltip = cameraEnabled ? 'Stop video' : 'Start video';
  const remoteCameraTooltip = cameraEnabled ? 'Stop video' : 'Request to start video';
  const cameraTooltip = isLocal ? localCameraTooltip : remoteCameraTooltip;
  const handleCameraClick = () => {
    if (isLocal) {
      toggleLocalCameraDevice();
    } else {
      if (stream) {
        if (cameraEnabled) {
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            videoState: AgoraRteMediaPublishState.Unpublished,
          });
        } else {
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            videoState: AgoraRteMediaPublishState.Published,
          });
          sendCustomPeerMessage(
            {
              cmd: CustomMessageCommandType.deviceSwitch,
              data: {
                deviceType: CustomMessageDeviceType.camera,
                deviceState: CustomMessageDeviceState.open,
              },
            },
            stream.fromUser.userUuid,
          );
        }
      }
    }
  };
  const localMicTooltip = micEnabled ? 'Mute' : 'Unmute';
  const remoteMicTooltip = micEnabled ? 'Mute' : 'Request to unmute';
  const micTooltip = isLocal ? localMicTooltip : remoteMicTooltip;
  const handleMicrophoneClick = () => {
    if (isLocal) {
      toggleLocalAudioRecordingDevice();
    } else {
      if (stream) {
        if (micEnabled) {
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            audioState: AgoraRteMediaPublishState.Unpublished,
          });
        } else {
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            audioState: AgoraRteMediaPublishState.Published,
          });

          sendCustomPeerMessage(
            {
              cmd: CustomMessageCommandType.deviceSwitch,
              data: {
                deviceType: CustomMessageDeviceType.mic,
                deviceState: CustomMessageDeviceState.open, // 0.close, 1.open
              },
            },
            stream.fromUser.userUuid,
          );
        }
      }
    }
  };
  const cameraIcon = cameraEnabled ? SvgIconEnum.FCR_CAMERA : SvgIconEnum.FCR_CAMERAOFF;
  const cameraIconColor = cameraEnabled ? {} : { iconSecondary: colors['red']['6'] };
  const micIcon = micEnabled ? SvgIconEnum.FCR_MUTE : SvgIconEnum.FCR_NOMUTE;
  const micIconColor = micEnabled ? {} : { iconSecondary: colors['red']['6'] };
  return {
    micIcon,
    micIconColor,
    cameraIcon,
    cameraIconColor,
    cameraTooltip,
    micTooltip,
    micEnabled,
    cameraEnabled,
    handleCameraClick,
    handleMicrophoneClick,
    toggleLocalAudioRecordingDevice,
    toggleLocalCameraDevice,
  };
};
